# ShurokkhaLink BD v0.1 release readiness

## Verified in the application

- Bangla is the default UI language; the language control switches the UI and
  document language to English or Bangla.
- Sample messages, empty-input validation, analysis, result clearing, and
  changed-input behavior are covered by component tests.
- The deterministic local analyzer reports a limited set of secret-request,
  urgency, prize-claim, link-presence, and URL-structure findings.
- Link presence is informational. URL parsing describes observable HTTP,
  embedded user information, IP-literal host, and punycode characteristics.
- The application source does not send submitted text to an analysis service,
  persist it, or log its content; the analyzer does not fetch or open submitted
  URLs.
- Narrow-screen CSS includes responsive breakpoints, wrapping, and larger
  language, example, and action controls. This is source inspection, not
  verification on actual devices.
- The table-driven synthetic corpus tests intended rules and edge cases. It
  does not measure real-world fraud detection accuracy.
- Static hosting preparation is documented in
  [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md). Cloudflare Pages is configured
  for Vite's `dist/` output with static security headers in `public/_headers`;
  the policy file is included in a local build, but no hosted deployment has
  been performed or verified.

## Automated release checks

The current local verification run completed:

- `npm run test:run` — passed (68 tests).
- `npm run build` — passed.
- `npm run lint` — passed.
- `npm run format:check` — passed.
- `npm run test` — passed (68 tests; one-shot, no watch process).

Component tests provide automated evidence for UI flows and announcements.
They are not a substitute for assistive-technology testing.

## Manual testing evidence and gaps

- The project owner reports initial testing with three people representing the
  intended audience. This task did not include their specific findings,
  comments, test procedure, or device details, so no conclusions about their
  understanding or satisfaction are recorded here.
- Physical-device and browser viewport checks at 320–375 CSS pixels have not
  been verified in this release task.
- Actual keyboard-only and screen-reader behavior has not been verified with
  assistive technology.
- Color contrast has not been measured with an independent tool.
- No production host, CDN response, deployment logs, browser extensions, or
  third-party instrumentation were inspected or tested. The recommended
  hosting provider's published configuration documentation was consulted, but
  no dashboard/account configuration was made.

## Remaining before public production deployment

- Complete and document responsive, keyboard, and assistive-technology testing
  in supported browsers and real devices.
- Measure visual contrast and remediate any failures.
- Review Bangla and English safety explanations with appropriate local-language
  and intended-user representatives; include their actual feedback in release
  evidence.
- Review the built application and intended hosting/privacy configuration,
  including security headers and any third-party services.
- Deploy a reviewed branch, then inspect actual HTTPS behavior, response
  headers, network requests, provider logging/privacy settings, and all loaded
  assets on the hosted URL.
- Decide and document operational ownership and support/contact information.

**Verdict:** suitable for a controlled local demonstration and v0.1 release
candidate review. Not yet verified for public production deployment. This
checklist is not a security certification or a claim of fraud-detection
accuracy.
