# ShurokkhaLink BD

ShurokkhaLink BD v0.1 is a Bangla-first local awareness tool for people in
Bangladesh who want a second look at a suspicious SMS, chat message, email
excerpt, or other text. The interface is not a government service and does not
claim official endorsement.

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

## Analyzer rules and explanations

`src/lib/analyzeMessage.ts` applies local regular expressions and the browser's
URL parser. Findings are deterministic indicators, not a verdict:

- **Secret request (`secret-request`)** — looks for request verbs such as
  “send”, “share”, “enter”, or “verify” near OTP, PIN, password, passcode, or
  verification/security-code wording. It supports a limited set of Bangla
  terms and English/Bangla combinations. Clear negation and sentence
  boundaries are checked to avoid treating protective advice or unrelated
  sentences as a request. The interface explains that sharing authentication
  secrets can put an account or money at risk and advises verifying through a
  known official channel.
- **Urgency (`urgent-pressure`)** — looks for English cues such as “act now”,
  a short stated time limit, a future blocked/suspended/closed consequence,
  explicit urgent labels, or an action paired with “immediately” or “right
  away”. Bangla cues include a conditional failure to act, an immediate action
  request, urgency paired with an action, and an account/service closure or
  block consequence. It explains that pressure can reduce time to verify and
  advises pausing and checking through a known channel. A bare use of words
  such as “urgent” does not trigger this rule.
- **Prize claim (`prize-claim`)** — looks for personal prize/winner/claim
  phrases, including supported Bangla wording, rather than a prize-related
  word alone. It advises against paying fees or sharing information and
  suggests independent official verification.
- **Link presence (`link-N`)** — recognises text beginning with `http://`,
  `https://`, or `www.`. This is informational only: a link alone is not
  evidence of fraud, and the tool does not open or check the destination.
- **URL structure (`link-N-http`, `-credentials`, `-ip`, `-punycode`)** —
  locally describes HTTP protocol, user information in the URL authority,
  IPv4/IPv6 literal hosts, or a punycode hostname label. These observable
  properties do not establish intent, reputation, site identity, or safety.

These are deliberately narrow text patterns, not language understanding.
Negation handling covers only specific forms; unusual grammar, spelling,
context, scripts, and punctuation can still be missed or misunderstood. A
finding may be a false positive, and lack of a finding is not reassurance.
The analyzer does not assign fraud scores or probabilities, and it does not
add warning categories beyond the listed local rules.
`src/lib/analyzeMessage.test.ts` keeps one table-driven synthetic evaluation
corpus: each case has an ID, category, message, exact expected finding IDs,
explicit excluded finding kinds, and a rationale. It tests intended analyzer
behaviour, not real-world fraud accuracy.

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

The analyzer uses local string processing and URL parsing in the browser.
Submitted text is held in React page memory while being analyzed; the
application code does not send it to a server or external AI service, persist
it in browser storage, or write its contents to application logs. Clearing the
form removes the current text and results from application state. The
application has no telemetry, analytics, backend, or community reporting.
This describes the application code and does not make claims about browser
extensions, the user's environment, or hosting infrastructure.

## Development

Use Node.js `24.22.1` (the version is recorded in `.nvmrc`). Dependencies are
managed with npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173/`). For a
short walkthrough of the three synthetic examples, language switching, and
accurate privacy/limitation wording, see [DEMO-GUIDE.md](./DEMO-GUIDE.md).

## Checks

```sh
npm run test       # Run tests once
npm run test:run   # Run tests once
npm run build      # Type-check and create a production build
npm run lint       # ESLint
npm run format     # Format project files with Prettier
npm run format:check
```

See [RELEASE-READINESS.md](./RELEASE-READINESS.md) for verified local
demonstration scope, manually unverified areas, and remaining steps before a
public production release.
