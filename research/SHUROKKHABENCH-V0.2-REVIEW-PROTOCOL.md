# ShurokkhaBench v0.2 Review Protocol

## Current status

The 90-case challenge corpus and every initial label are **DRAFT**. The corpus
has not been independently reviewed or validated. The evaluator's outputs are
measurements against these draft labels, not ground truth.

## Blinded second-person review

1. Select a reviewer who did not write the corpus or analyser rules.
2. Before sharing messages, make a review copy containing only each stable case
   ID, language group, category, and synthetic message. Remove
   `expectedFindings`, all rationales, label/review statuses, and any evaluator
   report. Do not show the reviewer the analyser's output.
3. Ask the reviewer to independently mark the intended observable finding
   kinds (`secret`, `urgency`, `prize`, `link`, `http`, `credentials`, `ip`,
   `punycode`) and explain each positive label. A finding is an observable
   pattern, not a conclusion that a message is fraudulent or safe.
4. Compare the independent labels with the draft labels. Record every
   disagreement by case ID, both proposed labels, the rationale from each
   reviewer, and the resolution (or mark it unresolved). Do not silently
   rewrite labels to match analyser predictions.
5. Have the reviewer re-check resolved cases without seeing predictions.
   Preserve the original draft and review record; version any accepted label
   changes in the corpus and explain them.
6. Only mark the corpus independently reviewed after this process is complete.
   Continue to call it synthetic and limited even after agreement.

The blank `shurokkhabench-v0.2-review-log.json` is a record template, not
evidence that a review occurred. Do not add names or claim review results that
have not been supplied by actual reviewers.

## Safety and privacy

All messages and URL values are synthetic. Domains use reserved example/test
names and IP literals use documentation ranges. The review and evaluation
commands parse strings locally; never visit, resolve, scan, or fetch a URL.
Do not replace examples with private messages, real credentials, or live
suspicious links.
