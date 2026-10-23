# ShurokkhaBench v0.1 — Development Benchmark Protocol

## Purpose

ShurokkhaBench v0.1 is a small, reproducible **synthetic development benchmark** for checking whether ShurokkhaLink BD emits its intended observable warning indicators across English, Bangla, and code-mixed text. It is not a real-world phishing-detection study and does not label messages as definitively fraudulent or safe.

## Research question

How consistently does the current deterministic analyser emit the expected finding kinds for a hand-authored set of synthetic messages representing a small range of benign wording, authentication-secret requests, urgency cues, prize claims, and URL structures?

## Unit of evaluation

One message is one case. Each case has an identifier, language group (`en`, `bn`, or `mixed`), scenario category, synthetic message text, expected finding kinds, and a rationale. Expected kinds refer to the features the current implementation is intended to notice—not a ground-truth judgement of whether a sender is malicious.

Supported finding kinds in this version are `secret`, `urgency`, `prize`, `link`, `http`, `credentials`, `ip`, and `punycode`. The benchmark compares **presence/absence by finding kind** per message. It does not count repeated instances of the same kind separately, assess explanation quality, or prove URL reputation.

## Metrics

The local test reports, overall and by language group:

- exact finding-set match count and rate;
- per-kind TP, FP, FN, and TN, where the expected kind list supplies the reference for intended analyser behaviour;
- per-kind precision, recall, F1, and false-positive rate.

These figures describe agreement with this authored synthetic corpus only. They must not be presented as estimates of real-world scam detection, generalisation to Bangladeshi users, or safety guarantees. A bare URL is treated as an informational `link` observation; it is not a fraud label.

## Limitations and safeguards

- The cases are synthetic and intentionally small; they are not a representative sample of messages seen in the wild.
- The same authors may have written the rules and these cases, so the benchmark can reflect author expectations and blind spots.
- Do not add real private messages, OTPs, passwords, account data, or live malicious URLs. Use reserved `.test` domains and documentation IP addresses in examples.
- Do not tune the rules against this corpus and then call this same corpus an independent test set. For stronger future evaluation, create a separately authored, reviewed, and locked evaluation set, record label disagreements, and report results by language and scenario.
- Review every mismatch manually before changing a rule. Avoid fixing one synthetic case in a way that adds false positives elsewhere.

## Reproduction

From the project root, run:

```powershell
npm run test:run
```

The test suite includes these benchmark cases and writes a result snapshot to:

`research/results/shurokkhabench-v0.1-results.json`

The report includes the dataset identifier, case-level expected and observed finding kinds, exact-set agreement, and per-kind metrics. Review mismatches before committing the snapshot.

## Versioning

`shurokkhabench-v0.1.json` is a development corpus. If a case or expectation changes, explain why in Git history and do not silently overwrite previously reported metrics. A future locked evaluation set should live in a separate file and should not be used for rule tuning.
