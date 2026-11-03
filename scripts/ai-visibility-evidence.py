#!/usr/bin/env python3
"""Normalize saved AI visibility responses without making provider/API calls.

Input is JSONL: one envelope per provider attempt, with engine, prompt_id,
optional model/status/measurement_type, and the raw provider JSON in `response`.
Output run directories are unique and never overwritten. Raw answers and raw
provider payloads are deliberately omitted from output.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
import uuid
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

BRAND_RE = re.compile(r"لينا\s*عقار|lenaqar", re.IGNORECASE)


def parsed_url(value: object) -> str | None:
    """Return a query/fragment/userinfo-free HTTP URL, or None if invalid."""
    if not isinstance(value, str):
        return None
    try:
        parts = urlsplit(value.strip())
        host = parts.hostname
        if parts.scheme.lower() not in {"http", "https"} or not host:
            return None
        host = host.rstrip(".").lower()
        if not host or any(ch.isspace() for ch in host):
            return None
        port = parts.port
        netloc = host if port is None else f"{host}:{port}"
        path = parts.path or "/"
        return urlunsplit((parts.scheme.lower(), netloc, path, "", ""))
    except (ValueError, UnicodeError):
        return None


def host_matches_domain(url: str, domain: str) -> bool:
    """Match a parsed hostname exactly or at a dot-delimited subdomain."""
    clean = parsed_url(url)
    if not clean:
        return False
    host = urlsplit(clean).hostname or ""
    wanted = domain.strip().lower().rstrip(".")
    return host == wanted or host.endswith("." + wanted)


def _append_url(destination: list[str], value: object) -> None:
    clean = parsed_url(value)
    if clean and clean not in destination:
        destination.append(clean)


def _openai(response: dict) -> tuple[str, list[str], list[str], bool]:
    texts: list[str] = []
    citations: list[str] = []
    retrieved: list[str] = []
    retrieval_observed = False
    for item in response.get("output") or []:
        if not isinstance(item, dict):
            continue
        if item.get("type") == "message":
            for part in item.get("content") or []:
                if not isinstance(part, dict):
                    continue
                if part.get("type") in {"output_text", "text"}:
                    texts.append(str(part.get("text") or ""))
                for annotation in part.get("annotations") or []:
                    if isinstance(annotation, dict) and annotation.get("url"):
                        _append_url(citations, annotation["url"])
        elif item.get("type") == "web_search_call":
            action = item.get("action") or {}
            retrieval_observed = retrieval_observed or isinstance(action.get("sources"), list)
            for source in action.get("sources") or []:
                _append_url(retrieved, source.get("url") if isinstance(source, dict) else source)
    return "\n".join(texts).strip(), citations, retrieved, retrieval_observed


def _anthropic(response: dict) -> tuple[str, list[str], list[str], bool]:
    texts: list[str] = []
    citations: list[str] = []
    retrieved: list[str] = []
    retrieval_observed = False
    for block in response.get("content") or []:
        if not isinstance(block, dict):
            continue
        if block.get("type") == "text":
            texts.append(str(block.get("text") or ""))
            for citation in block.get("citations") or []:
                if isinstance(citation, dict):
                    _append_url(citations, citation.get("url"))
        elif block.get("type") == "web_search_tool_result":
            retrieval_observed = retrieval_observed or isinstance(block.get("content"), list)
            for result in block.get("content") or []:
                if isinstance(result, dict):
                    _append_url(retrieved, result.get("url"))
    return "\n".join(texts).strip(), citations, retrieved, retrieval_observed


def _gemini(response: dict) -> tuple[str, list[str], list[str], bool]:
    texts: list[str] = []
    citations: list[str] = []
    retrieved: list[str] = []
    retrieval_observed = False
    for candidate in response.get("candidates") or []:
        if not isinstance(candidate, dict):
            continue
        content = candidate.get("content") or {}
        for part in content.get("parts") or []:
            if isinstance(part, dict) and part.get("text"):
                texts.append(str(part["text"]))
        metadata = candidate.get("groundingMetadata") or {}
        retrieval_observed = retrieval_observed or isinstance(metadata.get("groundingChunks"), list)
        chunks = metadata.get("groundingChunks") or []
        chunk_urls: list[str | None] = []
        for chunk in chunks:
            web = chunk.get("web") or {} if isinstance(chunk, dict) else {}
            clean = parsed_url(web.get("uri"))
            chunk_urls.append(clean)
            _append_url(retrieved, clean)
        # Grounding chunks are retrieved sources. They count as answer citations
        # only when a grounding support explicitly attaches one to answer text.
        for support in metadata.get("groundingSupports") or []:
            if not isinstance(support, dict):
                continue
            segment = support.get("segment") or {}
            segment_text = segment.get("text") if isinstance(segment, dict) else None
            if not isinstance(segment_text, str) or not segment_text.strip() or segment_text not in "\n".join(texts):
                continue
            for index in support.get("groundingChunkIndices") or []:
                if isinstance(index, int) and 0 <= index < len(chunk_urls):
                    _append_url(citations, chunk_urls[index])
    return "\n".join(texts).strip(), citations, retrieved, retrieval_observed


def _perplexity_search(response: dict) -> tuple[str, list[str], list[str], bool]:
    retrieved: list[str] = []
    retrieval_observed = isinstance(response.get("results"), list) or isinstance(response.get("search_results"), list)
    results = response.get("results") or response.get("search_results") or []
    for result in results:
        if isinstance(result, dict):
            _append_url(retrieved, result.get("url"))
    # The Search API returns result records, not a generated answer.
    return "", [], retrieved, retrieval_observed


def _is_provider_error(engine: str, response: dict) -> bool:
    if "error" in response and response.get("error") is not None:
        return True
    if engine == "anthropic" and response.get("type") == "error":
        return True
    return False


PARSERS = {
    "openai": _openai,
    "anthropic": _anthropic,
    "gemini": _gemini,
    "perplexity": _perplexity_search,
}


def load_prompt_index(path: Path) -> tuple[dict[str, dict], list[str]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    prompts = data.get("prompts")
    if not isinstance(prompts, list):
        raise ValueError("Prompt file must contain a prompts array")
    index: dict[str, dict] = {}
    for prompt in prompts:
        prompt_id = str(prompt.get("id", ""))
        if not prompt_id or prompt_id in index:
            raise ValueError("Prompt file contains a missing or duplicate prompt ID")
        index[prompt_id] = {"lang": prompt.get("lang", ""), "intent": prompt.get("intent", "")}
    return index, list(index)


def normalize_record(row: dict, prompt_index: dict[str, dict], target_domain: str) -> dict:
    engine = str(row.get("engine", "")).strip().lower()
    if engine not in PARSERS:
        raise ValueError(f"Unsupported engine: {engine or '(missing)'}")
    prompt_id = str(row.get("prompt_id", "")).strip()
    if prompt_id not in prompt_index:
        raise ValueError(f"Unknown prompt ID: {prompt_id or '(missing)'}")

    model = str(row.get("model") or "")
    measurement_type = str(row.get("measurement_type") or {
        "openai": "responses_api_web_search",
        "anthropic": "messages_api_web_search",
        "gemini": "gemini_api_search_grounding",
        "perplexity": "search_api",
    }[engine])
    supplied_status = str(row.get("status") or "ok").strip().lower()
    prompt_meta = prompt_index[prompt_id]
    answer = ""
    citations: list[str] = []
    retrieved: list[str] = []
    retrieval_observed = False
    if supplied_status.startswith("skipped"):
        status = "skipped"
    elif supplied_status.startswith("error"):
        status = "error"
    else:
        response = row.get("response")
        if not isinstance(response, dict):
            status = "empty"
        elif _is_provider_error(engine, response):
            status = "error"
        else:
            answer, citations, retrieved, retrieval_observed = PARSERS[engine](response)
            if engine == "perplexity":
                status = "search_only" if retrieved else "search_empty" if retrieval_observed else "empty"
            else:
                status = "ok" if answer else "empty"

    generated_answer = status == "ok"
    citation_matches = [url for url in citations if host_matches_domain(url, target_domain)]
    retrieved_matches = [url for url in retrieved if host_matches_domain(url, target_domain)]
    return {
        "engine": engine,
        "measurement_type": measurement_type,
        "model": model,
        "prompt_id": prompt_id,
        "lang": prompt_meta["lang"],
        "intent": prompt_meta["intent"],
        "status": status,
        "answer_observed": generated_answer,
        "answer_length": len(answer),
        "brand_mentioned": bool(BRAND_RE.search(answer)) if generated_answer else False,
        "answer_citations": citations,
        "target_domain_answer_citations": citation_matches,
        "retrieved_sources": retrieved,
        "target_domain_retrieved_sources": retrieved_matches,
        "retrieval_observed": retrieval_observed,
        "target_domain_search_presence": bool(retrieved_matches),
    }


def summarize(rows: list[dict]) -> dict:
    groups: dict[tuple[str, str, str], list[dict]] = defaultdict(list)
    for row in rows:
        groups[(row["engine"], row["measurement_type"], row["model"])].append(row)
    output = []
    for (engine, measurement_type, model), group in sorted(groups.items()):
        statuses = Counter(row["status"] for row in group)
        answers = [row for row in group if row["answer_observed"]]
        searches = [row for row in group if row["retrieval_observed"]]
        output.append({
            "engine": engine,
            "measurement_type": measurement_type,
            "model": model,
            "attempted": len(group),
            "status_counts": dict(sorted(statuses.items())),
            "answer_success_denominator": len(answers),
            "target_domain_answer_citations": sum(bool(row["target_domain_answer_citations"]) for row in answers),
            "answer_citation_rate": (
                f"{sum(bool(row['target_domain_answer_citations']) for row in answers)}/{len(answers)}"
                if answers else None
            ),
            "brand_mention_rate": (
                f"{sum(row['brand_mentioned'] for row in answers)}/{len(answers)}"
                if answers else None
            ),
            "retrieval_observed_denominator": len(searches),
            "target_domain_search_presence": sum(bool(row["target_domain_retrieved_sources"]) for row in searches),
            "search_presence_rate": (
                f"{sum(bool(row['target_domain_retrieved_sources']) for row in searches)}/{len(searches)}"
                if searches else None
            ),
        })
    return {"groups": output}


def read_jsonl(path: Path) -> list[dict]:
    rows = []
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError as error:
            raise ValueError(f"Input line {line_number} is not valid JSON") from error
        if not isinstance(row, dict):
            raise ValueError(f"Input line {line_number} must be a JSON object")
        rows.append(row)
    return rows


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_exclusive(path: Path, value: dict) -> None:
    with path.open("x", encoding="utf-8") as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2, sort_keys=True)
        stream.write("\n")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-jsonl", required=True, type=Path, help="Saved provider envelopes; no API calls are made")
    parser.add_argument("--prompts-json", required=True, type=Path, help="Canonical prompt file containing the preserved prompt IDs")
    parser.add_argument("--output-root", required=True, type=Path, help="Parent directory for unique immutable run outputs")
    parser.add_argument("--target-domain", default="lenaqar.com")
    args = parser.parse_args(argv)
    try:
        prompt_index, prompt_ids = load_prompt_index(args.prompts_json)
        inputs = read_jsonl(args.input_jsonl)
        # Add canonical prompt metadata while keeping row input provider-shaped.
        normalized = []
        seen = set()
        for row in inputs:
            item = normalize_record(row, prompt_index, args.target_domain)
            identity = (item["engine"], item["measurement_type"], item["model"], item["prompt_id"])
            if identity in seen:
                raise ValueError(f"Duplicate engine/model/prompt attempt: {identity}")
            seen.add(identity)
            normalized.append(item)
        args.output_root.mkdir(parents=True, exist_ok=True)
        run_id = f"{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex[:10]}"
        run_dir = args.output_root / run_id
        staging_dir = args.output_root / f".{run_id}.partial"
        staging_dir.mkdir(exist_ok=False)
        try:
            write_exclusive(staging_dir / "evidence.json", {
                "run_id": run_id,
                "prompt_universe": prompt_ids,
                "records": normalized,
            })
            write_exclusive(staging_dir / "summary.json", summarize(normalized))
            write_exclusive(staging_dir / "manifest.json", {
                "run_id": run_id,
                "created_utc": datetime.now(timezone.utc).isoformat(),
                "input_sha256": sha256(args.input_jsonl),
                "prompt_file_sha256": sha256(args.prompts_json),
                "prompt_file_reference": str(args.prompts_json),
                "prompt_universe_count": len(prompt_ids),
                "record_count": len(normalized),
                "target_domain": args.target_domain,
                "normalizer_version": 1,
                "network_calls": 0,
                "raw_answers_retained": False,
            })
            if run_dir.exists():
                raise FileExistsError(f"Run output already exists: {run_dir}")
            staging_dir.rename(run_dir)
        except Exception:
            shutil.rmtree(staging_dir, ignore_errors=True)
            raise
        print(f"Wrote {len(normalized)} normalized rows to {run_dir}")
        return 0
    except (OSError, ValueError, TypeError) as error:
        print(f"Normalization failed: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
