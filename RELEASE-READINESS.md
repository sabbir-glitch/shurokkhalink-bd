# ShurokkhaLink BD — v0.1 release-readiness record

**Status:** Public demonstration deployed; research and production-readiness work remain in progress.  
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

The application is designed to analyze submitted text locally in the browser. The source code is intended not to send message content to an analysis service, persist it in browser storage, or log its contents. The analyzer does not fetch or open submitted URLs. A source-level automated test covers no outbound analysis requests, storage, cookie writes, or message-content console writes under its test conditions.

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
- Recheck the live response headers and browser network behavior after relevant configuration or application changes.

## Release statement

ShurokkhaLink BD v0.1 is a live educational demonstration of a local, deterministic message-awareness checker. It is not a fraud-verification service, does not certify URLs as safe, and should not be relied on as the sole basis for security or financial decisions. It is not yet supported by an independent real-world accuracy study or a complete production security/accessibility review.
