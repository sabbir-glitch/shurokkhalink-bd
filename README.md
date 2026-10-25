# ShurokkhaLink BD

**Live demo:** https://shurokkhalink-bd.sabbirahamedmail.workers.dev/
**Source code:** https://github.com/sabbir-glitch/shurokkhalink-bd

ShurokkhaLink BD is a Bangla-first, browser-based awareness tool that gives users a second look at suspicious SMS messages, chat messages, and email excerpts. It explains a limited set of observable warning signs and suggests safer next steps. It is an independent educational project, not a government service or a fraud-verification authority.

## Features

- Bangla-first interface with an English language option.
- Optional server-side message translation and analysis, initiated only when the user selects the analysis action.
- Explanations and safer actions for detected warning indicators.
- Informational URL-structure observations for selected characteristics, including HTTP, embedded URL credentials, IP-literal hosts, and punycode labels.
- Synthetic examples, input clearing, and responsive layout.

## How to interpret results

A finding indicates a pattern worth checking; it does not prove that a message or sender is fraudulent. A message with no findings is not guaranteed to be safe. Link presence alone is informational. The application does not visit, fetch, scan, or check the reputation of submitted URLs.

AI output can be wrong, incomplete, or miss context. It is not proof that a message or sender is fraudulent, and a lack of indicators does not mean a message is safe. Submitted URLs are treated as text; the app does not visit or check their destinations. Do not use the result as the sole basis for a financial or security decision.

## Privacy design

Before the analysis button, the app discloses that clicking it sends the original message to an external service for translation and analysis. Typing alone does not transmit text. When configured, the Worker translates and analyses the submitted message according to the selected direction. The app does not store submitted text in browser storage or write message contents or credentials to application logs. The external service's data-handling and retention policies apply to text it receives. Clearing the form removes the current text and results from application state.

The Worker returns an explicit unavailable response when the secret is absent or the provider cannot return validated results. It does not fall back to fabricated or local findings. See [`worker/README.md`](worker/README.md) for server-side secret setup and provider behavior.

This describes the application code and does not make claims about browser extensions, the user's device, or all metadata handled by the hosting provider. Normal requests needed to load the public website still go to the host.

## Research and evaluation

[`research/SHUROKKHABENCH-PROTOCOL.md`](research/SHUROKKHABENCH-PROTOCOL.md) documents ShurokkhaBench v0.1, a small synthetic **development** benchmark with English (`en`), Bangla (`bn`), and mixed (`mixed`) cases. The checked-in results snapshot is [`research/results/shurokkhabench-v0.1-results.json`](research/results/shurokkhabench-v0.1-results.json).

The 36-case benchmark evaluates the repository's deterministic analysis library, not the Groq model or the current AI response. A 36/36 exact match means the library matched hand-authored expectations on that test corpus. It is **not** a measurement of real-world scam detection accuracy, and the test set is not an independent holdout set. Do not use it to make performance claims about AI analysis.

## Run locally

Requirements: Node.js version recorded in [`.nvmrc`](.nvmrc) and npm.

```powershell
npm ci
npm run dev
```

Run the automated checks:

```powershell
npm run test:run
npm run lint
npm run build
```

Vitest includes unit, component, and ShurokkhaBench tests. A successful run verifies the covered tests; it does not substitute for independent real-world evaluation, accessibility testing, or security review.

## Deployment

The public demonstration is hosted on Cloudflare Workers using a Git-connected build from the `main` branch. Deployment configuration is managed in the Cloudflare dashboard. See [`DEPLOYMENT-GUIDE.md`](DEPLOYMENT-GUIDE.md) for the current arrangement and verification notes.

A successful push to `main` is expected to trigger the connected deployment. Check the Cloudflare build/deployment history after changes to confirm that a new deployment completed successfully.

## Security headers

The live HTTP response was manually checked on 24 October 2026. The response returned HTTP 200 and included these headers:

- `Content-Security-Policy`
- `Permissions-Policy`
- `Referrer-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`

Header presence at that time is not a full security audit. The exact values and behavior should be rechecked after hosting configuration changes.

## Project status and limitations

This is a public v0.1 demonstration and a research-in-progress project, not a production security product. Remaining work includes an independently reviewed evaluation set, structured false-positive/false-negative analysis, more robust URL edge-case testing, and broader accessibility and user testing. See [`RELEASE-READINESS.md`](RELEASE-READINESS.md).

## License

Check the repository's license file before redistributing or reusing the project. If no license file is present, the repository should not be assumed to grant an open-source reuse license.
