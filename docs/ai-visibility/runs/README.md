# AI panel runs

One JSONL file per round (`round-1.jsonl`, `round-2.jsonl`, …), one line per product × prompt × run, with the fields in `../panel-v1.json` → `record_fields`.
Response text and a screenshot go next to it: `round-1/<run_id>.txt` and `round-1/<run_id>.png`.
`status` is `completed`, `failed` or `skipped`, and `status_reason` is required unless the run completed. Skipped and failed runs are never counted in the denominators.
