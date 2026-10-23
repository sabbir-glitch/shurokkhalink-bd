# ShurokkhaLink BD

ShurokkhaLink BD is a Bangla-first awareness tool for people in Bangladesh who
want a second look at a suspicious SMS, chat message, email excerpt, or other
text. The interface is not a government service and does not claim official
endorsement.

## What it does

- Checks message text in the browser for a limited set of explainable warning
  signs: requests for OTPs, PINs, passwords, or verification codes; urgent
  pressure; prize or unexpected-money claims; and links.
- Uses specific request and claim wording rather than flagging a prize-related
  word on its own, and ignores clearly negated advice to protect a secret.
- Separately describes a few observable URL characteristics, including HTTP,
  embedded user information, IP-address hosts, and punycode hostnames.
- Explains why each finding deserves attention and suggests a safer next step.
- Offers a complete English/Bangla interface, with Bangla selected by default,
  and synthetic examples that can be loaded into the analyzer.

## Limitations and safety

This is a small, deterministic, rule-based checker. A warning sign is not proof
of fraud, and a message with no findings may still be fraudulent. The tool
cannot verify a sender's identity, certify that a link is safe, or conclusively
determine fraud. URL structure checks are limited observations, not a
reputation or safety check.

The analyzer does not open or contact submitted links. Do not share OTPs, PINs,
passwords, or verification codes. If a message is uncertain, contact the
organisation through a known official channel rather than using details in the
message.

## Privacy

Analysis uses local string processing and URL parsing in the browser. Submitted
text stays in browser memory for the current page session; it is not sent to a
server or external AI service, saved to browser storage, or written to logs.
There is no telemetry, analytics, backend, or community reporting.

## Development

Use Node.js `24.22.1` (the version is recorded in `.nvmrc`). Dependencies are
managed with npm.

```sh
npm install
npm run dev
```

## Checks

```sh
npm run test       # Run tests once
npm run test:run   # Run tests once
npm run build      # Type-check and create a production build
npm run lint       # ESLint
npm run format     # Format project files with Prettier
npm run format:check
```
