# ShurokkhaLink BD — Release Readiness Record

**Project status:** AI-enabled cybersecurity-awareness demonstration deployed. Production configuration and initial manual behaviour have been checked by the project owner. Independent evaluation and a complete security and accessibility review remain outstanding.

**Last evidence update:** 27 October 2026.

## 1. Current deployment status

The production application is hosted at:

- Application: https://shurokkhalink-bd.sabbirahamedmail.workers.dev/
- API status: https://shurokkhalink-bd.sabbirahamedmail.workers.dev/api/ai/status

On 27 October 2026, the production status endpoint returned:

```json
{
  "status": "ready",
  "configured": true,
  "version": "ai-api.v1"
}
```

This confirms that the status endpoint reported the AI integration as configured at the time of the check. It does not, by itself, establish end-to-end reliability or detection accuracy.

PR #7, "Fix AI endpoint rate limiting and privacy metadata," was merged into `main` with merge commit `d79cead`. The change includes AI endpoint rate limiting and preview rate-limit configuration.

## 2. Automated verification

The project owner reported the following successful checks before PR #7 was merged:

- `npm run test:run` — 177 tests passed.
- `npm run lint` — completed successfully.
- `npm run build` — completed successfully.
- `npx wrangler deploy --dry-run` — completed successfully.

These results are recorded as pre-merge validation. They must not be described as independently reproduced or as post-merge test runs.

For future changes, record the actual command output and date. Re-run the relevant checks against the final code whenever application logic, dependencies, or deployment configuration changes.

## 3. Manual application checks

The project owner reported successful manual testing of the application.

The preview screenshots dated 27 October 2026 show these examples:

- Suspicious English message requesting an immediate verification code after threatening account suspension.
- Suspicious Banglish message threatening account blockage and requesting an OTP.
- Suspicious Bangla message threatening account closure and requesting an OTP.
- Harmless English greeting, "Hello, how are you?", which was translated into Bangla without scam warning signs.

The suspicious examples produced translations and warnings consistent with the messages shown. These examples establish basic functional behaviour for the tested inputs, not comprehensive detection performance.

Record production and preview test results separately. A successful preview test must not be presented as proof that the same test was completed against production.

## 4. Privacy and application scope

The interface displays an external-processing disclosure explaining that submitted messages are sent for translation and analysis.

The intended application flow is that typing alone does not submit a message; the user initiates processing through the analysis action. The Worker uses the server-side `GROQ_API_KEY` secret to make provider requests.

The API key must not be embedded in frontend code, committed to the repository, or returned to the browser. Automated provider tests should continue to use mocks and must not require a real API key.

The application is not intended to store submitted message content in browser storage or log message contents or credentials. These implementation claims should be checked against the current code and runtime behaviour whenever the privacy flow or logging changes.

The external provider's data-handling and retention terms apply to the content it receives. Loading the website and making requests also generates ordinary network traffic and connection metadata. This document is not a claim that no network traffic or provider-side processing occurs.

Before broader use, confirm the applicable provider data-handling terms and that the intended usage can remain within the project's zero-cost operating requirement. Do not introduce a paid fallback.

## 5. Existing ShurokkhaBench evidence

ShurokkhaBench v0.1 contains 36 synthetic cases: 12 English, 12 Bangla, and 12 mixed-language cases. Its recorded development baseline reported 36/36 exact finding-set matches.

ShurokkhaBench v0.2 has a separate, larger evaluation effort, including 90 synthetic cases. The preliminary result previously reported was 85/90 exact finding-set matches, with five mismatches requiring investigation and independent review.

These figures measure agreement with the benchmark's expected labels. They are not estimates of real-world phishing-detection accuracy.

The rule-based analyser benchmark must remain distinct from evaluation of the live AI-powered pipeline. Results from one must not be presented as results for the other.

Historical benchmark files and research review logs must be preserved. Do not overwrite historical results when recording a new experiment.

## 6. Security headers previously observed

On 24 October 2026, the homepage response was reported to include:

- `Content-Security-Policy`
- `Permissions-Policy`
- `Referrer-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`

The recorded Content Security Policy was:

```text
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self' data:; connect-src 'none'
```

The recorded Permissions Policy disabled camera, microphone, and geolocation access. The Referrer Policy was `strict-origin-when-cross-origin`.

These observations apply to the homepage response checked on 24 October. Recheck relevant live responses after deployment or configuration changes. Header presence alone is not a penetration test, security audit, or certification.

## 7. Remaining work

The following items need recorded evidence before the project can claim a more comprehensive evaluation:

1. Finish the ShurokkhaBench v0.2 mismatch investigation and independent review of expected labels.
2. Create and document a separate evaluation of the live AI pipeline using synthetic messages, covering false positives, false negatives, language handling, translation fidelity, and explanation quality.
3. Verify rate-limit behaviour with controlled tests, without treating Cloudflare's approximate counters as a strict global quota.
4. Recheck server-side secret handling, request validation, oversized inputs, provider failures, timeouts, privacy disclosures, and relevant logs.
5. Recheck live security headers and browser network behaviour after relevant changes.
6. Complete and record keyboard navigation, screen-reader, contrast, and mobile viewport checks.
7. If user testing is conducted, document the procedure, participant consent, anonymised observations, and limitations.
8. Verify the production push-to-deployment process when a controlled, harmless change is next required. Avoid unnecessary production changes solely to generate evidence.

Mark an item complete only when its supporting evidence has been recorded. If a check has already been completed, add the date, method, and actual result rather than repeating it unnecessarily.

## 8. Release statement

ShurokkhaLink BD is a cybersecurity-awareness and educational tool. It is not a fraud-verification service and cannot conclusively determine whether every message or URL is malicious or safe.

AI-generated translations, warnings, and explanations may be inaccurate or incomplete. The application should not be the sole basis for security or financial decisions.

The current deployment and initial manual tests demonstrate working functionality, but they do not establish independent real-world detection accuracy or completion of a comprehensive production security and accessibility review.
