# ShurokkhaLink BD local demo

## Start the app

From the project directory, run:

```sh
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173/`).

## Demonstrate the examples

1. The interface opens in Bangla. Choose **OTP অনুরোধ**, review the external-processing disclosure, then choose **বার্তা বিশ্লেষণ করুন**. When the Worker Secret is available, explain that translation and analysis may be wrong or incomplete.
2. Choose **পুরস্কারের বার্তা** and analyse it. Explain that the prize wording is a reason to verify independently, not proof of fraud.
3. Choose **লিংকসহ বার্তা** and analyse it. A link by itself is not proof of fraud; the app does not open or check the destination.
4. Select **English** or **বাংলা** at the top to switch languages. Use **মুছে ফেলুন** / **Clear** to clear the input and results.

## Explain privacy accurately

The original message is sent only when the user chooses the analysis button
after reading the external-processing disclosure. When configured, the Worker
translates it according to the selected direction and analyses the English
text. The external service's data-handling and retention policies apply. If
the Worker Secret is missing or the service is unavailable, the app displays
no analysis result.

## Explain what the tool can establish

It can show a small set of wording patterns and observable URL structure
characteristics. Its findings are limited indicators. It cannot establish
whether a message is fraudulent, verify a sender or destination, determine a
site's reputation, or certify a link as safe. No finding does not mean a
message is safe. This is an independent awareness tool, not a government
service or endorsed product.
