# v0.1 release-readiness checklist

## Verified for a local demonstration

- [x] Workspace dependencies and existing implementation used; no new
      dependencies added.
- [x] Bangla-first and English UI, sample messages, validation, analysis, and
      clearing covered by component tests.
- [x] Responsive CSS includes narrow-screen layouts, wrapping, and larger
      language/example touch targets.
- [x] Keyboard focus styling, semantic headings and form label, validation
      alert, language-group labels, and a concise live analysis status are present
      in the source.
- [x] Analyzer remains local and deterministic; no submitted URL is fetched or
      opened by application code.
- [x] Synthetic analyzer corpus, build, lint, and formatting checks pass (see
      the release verification report for the observed run).
- [x] `.nvmrc` pins Node.js `24.22.1`; documented start command is `npm run
dev`.

## Not manually verified

- [ ] Physical-device or browser responsive testing at specific viewport sizes.
- [ ] Screen-reader behavior with actual assistive technology and keyboard-only
      usability across supported browsers.
- [ ] Color contrast measured using an independent accessibility tool.
- [ ] Hosting/CDN behavior, production request logs, deployment security
      headers, and browser-extension or third-party instrumentation behavior.
- [ ] Message-pattern performance against a representative, consented,
      real-world language corpus. Synthetic cases do not establish detection
      accuracy.

## Before any public production release

- [ ] Perform manual accessibility and responsive testing, then address
      findings.
- [ ] Review privacy wording and actual hosting/browser delivery configuration
      in the intended production environment.
- [ ] Conduct an independent security and privacy review of the production
      build and hosting setup.
- [ ] Review Bangla/English safety wording with appropriate local-language and
      user representatives.
- [ ] Make and document a product decision about support/contact information
      and operational ownership before offering the tool publicly.

This checklist does not certify production readiness. The current scope is a
local v0.1 demonstration; the analyzer is not a fraud verdict or URL safety
service.
