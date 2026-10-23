# ShurokkhaLink BD local demo

## Start the app

From the project directory, run:

```sh
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173/`).

## Demonstrate the examples

1. The interface opens in Bangla. Choose **OTP অনুরোধ**, then **বার্তা বিশ্লেষণ করুন**. Point out the OTP request and urgency findings and their safer actions.
2. Choose **পুরস্কারের বার্তা** and analyse it. Explain that the prize wording is a reason to verify independently, not proof of fraud.
3. Choose **লিংকসহ বার্তা** and analyse it. This sample uses HTTPS so the result demonstrates informational link presence only. A link by itself is not a fraud finding; the app does not open or check the destination.
4. Select **English** or **বাংলা** at the top to switch languages. Use **মুছে ফেলুন** / **Clear** to clear the input and results.

## Explain privacy accurately

The analyzer runs local string matching and URL parsing in the browser. The
application code does not send the submitted message to a server, save it to
browser storage, or log its contents. A development server still serves the
application itself; this statement is specifically about the submitted message
and the analyzer's code.

## Explain what the tool can establish

It can show a small set of wording patterns and observable URL structure
characteristics. Its findings are limited indicators. It cannot establish
whether a message is fraudulent, verify a sender or destination, determine a
site's reputation, or certify a link as safe. No finding does not mean a
message is safe. This is an independent awareness tool, not a government
service or endorsed product.
