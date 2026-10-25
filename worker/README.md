# Worker AI API

The Cloudflare Worker handles `/api/*` requests and delegates other requests
to the static assets binding. It calls Groq's OpenAI-compatible chat
completions endpoint with `openai/gpt-oss-120b` when the `GROQ_API_KEY` Worker
Secret is configured. If the secret is missing, the API reports that AI is
unavailable and never returns a fabricated result.

## Configure the Worker Secret

Set `GROQ_API_KEY` as a Cloudflare Worker Secret in the Cloudflare dashboard,
or use Wrangler's interactive secret command:

```powershell
npx wrangler secret put GROQ_API_KEY
```

Enter the key only at Wrangler's prompt. Do not put it in source files,
frontend/Vite variables, `wrangler.jsonc`, command arguments, logs, or API
responses. Do not enable paid billing or configure a paid fallback. If the
account's free usage is unavailable or exhausted, the API returns an explicit
unavailable response.

## Analysis workflow

Send JSON to `POST /api/ai/analyze`:

```json
{
  "version": "ai-analysis-request.v1",
  "message": "Synthetic sample text",
  "consent": {
    "messageProcessing": true,
    "translation": true,
    "externalAiProcessing": true
  }
}
```

The endpoint requires all consent fields to be explicitly `true`, rejects
cross-origin browser requests, and accepts messages up to 10,000 JavaScript
characters in request bodies up to 48 KiB. The frontend shows a redacted
preview before sending, but sends the original message only after the user
consents and submits.

The Worker sends the original message to Groq for translation first. Only the
validated English translation is then sent for scam-indicator analysis. The
Worker validates both provider outputs and returns only the versioned
translation and structured analysis supported by the app's localized safety
recommendations. It does not fetch URLs from messages. Groq receives the
message text; its own data-handling and retention policies apply.

Provider calls have an eight-second timeout per stage and bounded response
size. Missing credentials, timeouts, rate limits, provider failures, and
malformed responses return explicit `error` or `unavailable` responses.
Provider details and credentials are not logged or included in API responses.
The API uses `Cache-Control: no-store`.

Worker tests mock the provider or `fetch`; CI does not require a real key or
make requests to Groq.
