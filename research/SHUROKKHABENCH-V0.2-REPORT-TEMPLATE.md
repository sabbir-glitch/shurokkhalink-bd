# ShurokkhaBench v0.2 — Evaluation Report

> Status: **DRAFT** until independent label review is complete. Results measure
> agreement with a synthetic challenge set, not real-world phishing-detection
> effectiveness.

## Dataset design and language coverage

- Corpus version and SHA-256:
- Total cases:
- English / native Bangla / mixed-language cases:
- Scenario categories and contrast groups:
- Reserved-domain and documentation-IP policy:

## Labeling and review procedure

- Initial label status: DRAFT / requires human review.
- Blinded second-person review completed?:
- Reviewer procedure and date (do not include personal details without consent):
- Disagreements by case ID:
- Resolution and rationale, including unresolved items:
- Was the reviewer kept unaware of analyser predictions?:

## Automated checks

- Test command and result:
- Lint and build results:
- Evaluator command and report path:
- Dataset hash recorded in candidate report:

## Overall results

| Measure                           | Result |
| --------------------------------- | -----: |
| Exact finding-set matches / cases |        |
| Exact finding-set agreement       |        |
| Mismatch count                    |        |

## Per-language results

| Language group                | Cases | Exact matches | Exact-set agreement |
| ----------------------------- | ----: | ------------: | ------------------: |
| English                       |       |               |                     |
| Native Bangla                 |       |               |                     |
| Mixed Bangla-English/Banglish |       |               |                     |

## Per-finding-kind metrics

Copy TP, FP, FN, TN, precision, recall, and F1 from the candidate JSON report.
State when a metric is undefined.

## Error analysis

List every mismatch by stable case ID, expected and observed finding kinds,
review status, and a cautious explanation. Separate corpus-label disagreements
from analyser-rule misses and false positives.

## Limitations and threats to validity

Discuss synthetic wording, small curated coverage, authorship overlap,
language/script variation, rule-based limitations, draft/unreviewed labels, and
the absence of representative real-world data. Do not convert these metrics
into claims about real-world detection accuracy, safety, or fraud prevalence.

## Next steps

Record label review, disagreements, any separately versioned corpus changes,
rule changes supported by reviewed evidence, and a future evaluation design
that does not tune on its holdout set.
