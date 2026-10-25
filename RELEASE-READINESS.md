# ShurokkhaLink BD — v0.1 release-readiness record

**Status:** Public demonstration deployed; the local source now includes a consent-gated Groq Worker integration, which has not been deployed or independently evaluated.
**Last evidence update:** 24 October 2026.

## Evidence recorded

- The project owner reports that the public hosted interface loads and that Bangla/English switching, message analysis, and clearing results work.
- Local `npm run test:run` completed with **106 tests passing**: 59 analyser tests, 9 component tests, and 38 ShurokkhaBench evaluator tests.
- Local `npm run build` succeeded. The build output included `dist/_headers`.
- The deployed homepage returned HTTP 200.
- The observed deployed response contained `Content-Security-Policy`, `Permissions-Policy`, `Referrer-Policy`, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY`.
- Cloudflare dashboard settings showed the GitHub repository `sabbir-glitch/shurokkhalink-bd`, production branch `main`, build command `npm run build`, and deploy command `npx wrangler deploy`.

These are project-owner terminal/dashboard observations recorded in the project notes, not an independent third-party audit.

## Privacy and application scope

The browser shows a redacted preview, then sends the original submitted text to the Worker only after explicit user consent. When the `GROQ_API_KEY` Worker Secret is configured, the Worker sends the original text to Groq for translation, then sends the English translation for analysis. The app does not persist submitted text in browser storage or log message contents or credentials. The analyzer does not fetch or open submitted URLs. Groq's data-handling and retention policies apply to the text it receives. Automated provider tests use mocks and do not require a real key.

This is not a claim that no network traffic exists: loading the website requires requests to the hosting provider, which may process ordinary connection metadata. Browser extensions, the user's device, and the hosting provider are outside the application's direct control.

## Benchmark evidence and limitations

ShurokkhaBench v0.1 contains 36 hand-authored synthetic cases: 12 English, 12 Bangla, and 12 mixed-language. The recorded baseline reported 36/36 exact finding-set matches, and no mismatches in that development corpus.

This measures agreement with the expected labels defined by the same project development process. It does **not** measure real-world phishing-detection accuracy, prove that messages are malicious or safe, or establish generalization to unseen messages. The benchmark is not an independent holdout set, and the current data should not be presented as an independently annotated dataset.

## Security headers observed

The homepage response was checked on 24 October 2026. The observed policy included:

- `Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self' data:; connect-src 'none'`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`

Header presence was verified for the homepage response only. This is not a full penetration test, audit, or certification.

## Remaining work before claiming production readiness

- Create a separate evaluation set with new message templates not used to tune the current rules; document how expected findings are assigned and reviewed.
- Analyze false positives and false negatives per language and finding type; report limitations without overclaiming accuracy.
- Review URL parsing and Unicode edge cases using safe, non-fetching tests.
- Run keyboard-only, screen-reader, contrast, and real mobile viewport checks; record the actual outcomes.
- If conducting user testing, record the procedure, participant consent, anonymized observations, and limitations. Do not invent or infer participant results.
- Verify the Git push-to-deployment cycle with one controlled, harmless change and confirm its successful completion in Cloudflare.
- Before configuring the Groq Worker Secret, verify provider data-handling/retention terms and confirm that the account can be used without enabling paid billing. Do not configure a paid fallback.
- Recheck the live response headers and browser network behavior after relevant configuration or application changes.

## Release statement

ShurokkhaLink BD remains an educational demonstration, not a fraud-verification service. AI findings may be inaccurate or incomplete, do not certify URLs as safe, and should not be relied on as the sole basis for security or financial decisions. The Worker integration requires a separately configured Cloudflare Secret and is not evidence of a deployed or independently validated provider setup. The project is not yet supported by an independent real-world accuracy study or a complete production security/accessibility review.
