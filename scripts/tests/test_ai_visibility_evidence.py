import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "ai-visibility-evidence.py"
SPEC = importlib.util.spec_from_file_location("ai_visibility_evidence", SCRIPT)
evidence = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(evidence)


PROMPTS = {
    "P01": {"lang": "ar-eg", "intent": "price"},
    "P02": {"lang": "en", "intent": "price"},
    "B01": {"lang": "ar-eg", "intent": "best-buy"},
}


class EvidenceNormalizerTests(unittest.TestCase):
    def test_openai_answer_citations_are_separate_from_retrieved_sources(self):
        row = evidence.normalize_record(
            {
                "engine": "openai",
                "prompt_id": "P01",
                "model": "test-model",
                "response": {
                    "output": [
                        {
                            "type": "message",
                            "content": [
                                {
                                    "type": "output_text",
                                    "text": "Lenaqar has a relevant listing.",
                                    "annotations": [
                                        {"type": "url_citation", "url": "https://www.lenaqar.com/listing?id=private"}
                                    ],
                                }
                            ],
                        },
                        {
                            "type": "web_search_call",
                            "action": {
                                "sources": [
                                    {"url": "https://lenaqar.com.evil.test/search"},
                                    {"url": "https://nawy.com/result"},
                                ]
                            },
                        },
                    ]
                },
            },
            PROMPTS,
            "lenaqar.com",
        )

        self.assertEqual(row["status"], "ok")
        self.assertTrue(row["brand_mentioned"])
        self.assertEqual(row["target_domain_answer_citations"], ["https://www.lenaqar.com/listing"])
        self.assertEqual(row["retrieved_sources"], ["https://lenaqar.com.evil.test/search", "https://nawy.com/result"])
        self.assertEqual(row["target_domain_retrieved_sources"], [])

    def test_search_only_results_are_not_answer_citations(self):
        row = evidence.normalize_record(
            {
                "engine": "perplexity",
                "prompt_id": "P02",
                "response": {"results": [{"url": "https://lenaqar.com/guide", "snippet": "Search snippet"}]},
            },
            PROMPTS,
            "lenaqar.com",
        )
        summary = evidence.summarize([row])["groups"][0]

        self.assertEqual(row["status"], "search_only")
        self.assertEqual(row["answer_citations"], [])
        self.assertEqual(summary["answer_success_denominator"], 0)
        self.assertIsNone(summary["answer_citation_rate"])
        self.assertEqual(summary["retrieval_observed_denominator"], 1)
        self.assertEqual(summary["search_presence_rate"], "1/1")

    def test_exact_host_matching_rejects_malicious_substring_hosts(self):
        self.assertTrue(evidence.host_matches_domain("https://lenaqar.com/path", "lenaqar.com"))
        self.assertTrue(evidence.host_matches_domain("https://www.lenaqar.com/path", "lenaqar.com"))
        self.assertFalse(evidence.host_matches_domain("https://lenaqar.com.evil.test/path", "lenaqar.com"))
        self.assertFalse(evidence.host_matches_domain("https://notlenaqar.com/path", "lenaqar.com"))

    def test_skipped_error_and_empty_rows_are_excluded_from_success_denominators(self):
        rows = [
            evidence.normalize_record({"engine": "openai", "prompt_id": "P01", "status": "skipped:no key"}, PROMPTS, "lenaqar.com"),
            evidence.normalize_record({"engine": "openai", "prompt_id": "P02", "status": "error:TimeoutError"}, PROMPTS, "lenaqar.com"),
            evidence.normalize_record({"engine": "openai", "prompt_id": "B01", "response": {"output": []}}, PROMPTS, "lenaqar.com"),
        ]
        summary = evidence.summarize(rows)["groups"][0]

        self.assertEqual(summary["attempted"], 3)
        self.assertEqual(summary["status_counts"], {"empty": 1, "error": 1, "skipped": 1})
        self.assertEqual(summary["answer_success_denominator"], 0)
        self.assertIsNone(summary["answer_citation_rate"])

    def test_gemini_grounding_requires_text_support_to_count_as_citation(self):
        base = {
            "engine": "gemini",
            "prompt_id": "P01",
            "response": {
                "candidates": [{
                    "content": {"parts": [{"text": "A generated response."}]},
                    "groundingMetadata": {
                        "groundingChunks": [{"web": {"uri": "https://lenaqar.com/guide"}}],
                    },
                }]
            },
        }
        row = evidence.normalize_record(base, PROMPTS, "lenaqar.com")
        self.assertEqual(row["retrieved_sources"], ["https://lenaqar.com/guide"])
        self.assertEqual(row["answer_citations"], [])

        base["response"]["candidates"][0]["groundingMetadata"]["groundingSupports"] = [
            {"groundingChunkIndices": [0]}
        ]
        cited = evidence.normalize_record(base, PROMPTS, "lenaqar.com")
        self.assertEqual(cited["answer_citations"], [])

        base["response"]["candidates"][0]["groundingMetadata"]["groundingSupports"][0]["segment"] = {
            "text": "A generated response."
        }
        cited = evidence.normalize_record(base, PROMPTS, "lenaqar.com")
        self.assertEqual(cited["target_domain_answer_citations"], ["https://lenaqar.com/guide"])

    def test_provider_error_objects_are_errors_not_empty_successes(self):
        row = evidence.normalize_record(
            {
                "engine": "openai",
                "prompt_id": "P01",
                "response": {"error": {"message": "private provider detail"}},
            },
            PROMPTS,
            "lenaqar.com",
        )
        self.assertEqual(row["status"], "error")
        self.assertEqual(row["answer_length"], 0)

    def test_successful_empty_search_counts_in_retrieval_denominator_but_error_does_not(self):
        rows = [
            evidence.normalize_record(
                {"engine": "perplexity", "prompt_id": "P01", "response": {"results": []}},
                PROMPTS,
                "lenaqar.com",
            ),
            evidence.normalize_record(
                {"engine": "perplexity", "prompt_id": "P02", "response": {"error": {"message": "failed"}}},
                PROMPTS,
                "lenaqar.com",
            ),
        ]
        summary = evidence.summarize(rows)["groups"][0]
        self.assertEqual([row["status"] for row in rows], ["search_empty", "error"])
        self.assertEqual(summary["attempted"], 2)
        self.assertEqual(summary["retrieval_observed_denominator"], 1)
        self.assertEqual(summary["target_domain_search_presence"], 0)
        self.assertEqual(summary["search_presence_rate"], "0/1")

    def test_anthropic_text_citations_are_distinct_from_search_tool_results(self):
        row = evidence.normalize_record(
            {
                "engine": "anthropic",
                "prompt_id": "P01",
                "response": {"content": [
                    {"type": "text", "text": "A generated answer.", "citations": [
                        {"url": "https://lenaqar.com/market"},
                    ]},
                    {"type": "web_search_tool_result", "content": [
                        {"url": "https://lenaqar.com.evil.test/result"},
                        {"url": "https://nawy.com/result"},
                    ]},
                ]},
            },
            PROMPTS,
            "lenaqar.com",
        )
        self.assertEqual(row["target_domain_answer_citations"], ["https://lenaqar.com/market"])
        self.assertEqual(row["target_domain_retrieved_sources"], [])

    def test_run_output_is_unique_redacted_and_keeps_the_prompt_universe(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            prompts = root / "prompts.json"
            prompt_list = [{"id": f"P{i:02d}", "lang": "en", "intent": "price", "text": "question"} for i in range(1, 41)]
            prompts.write_text(json.dumps({"prompts": prompt_list}), encoding="utf-8")
            source = root / "responses.jsonl"
            source.write_text(json.dumps({
                "engine": "openai",
                "prompt_id": "P01",
                "model": "test",
                "response": {"output": [{"type": "message", "content": [{
                    "type": "output_text",
                    "text": "private answer text",
                    "annotations": [{"url": "https://lenaqar.com/listing?token=secret"}],
                }]}]},
            }) + "\n", encoding="utf-8")
            output = root / "runs"

            self.assertEqual(evidence.main(["--input-jsonl", str(source), "--prompts-json", str(prompts), "--output-root", str(output)]), 0)
            self.assertEqual(evidence.main(["--input-jsonl", str(source), "--prompts-json", str(prompts), "--output-root", str(output)]), 0)
            run_dirs = sorted(path for path in output.iterdir() if path.is_dir())
            self.assertEqual(len(run_dirs), 2)
            payload = (run_dirs[0] / "evidence.json").read_text(encoding="utf-8")
            parsed = json.loads(payload)
            self.assertEqual(len(parsed["prompt_universe"]), 40)
            self.assertNotIn("private answer text", payload)
            self.assertNotIn("secret", payload)
            manifest = json.loads((run_dirs[0] / "manifest.json").read_text(encoding="utf-8"))
            self.assertEqual(manifest["network_calls"], 0)
            self.assertFalse(manifest["raw_answers_retained"])


if __name__ == "__main__":
    unittest.main()
