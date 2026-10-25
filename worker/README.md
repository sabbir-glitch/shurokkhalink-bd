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

Send JSON to `POST /api/ai/analyze` after the user chooses the visible analysis
action:

```json
{
  "version": "ai-analysis-request.v3",
  "message": "Synthetic sample text",
  "userInitiated": true
}
```

The endpoint requires the explicit action marker, rejects cross-origin browser
requests, and accepts messages up to 10,000 JavaScript characters in request
bodies up to 48 KiB.
Before the action button, the frontend discloses that the original message
will be sent to an external service for translation and analysis. Typing does
not make a request.

The Worker detects the input language automatically. For Bangla and Banglish,
it translates to English and analyses that translation. For English, it
translates to Bangla and analyses the original English text. For other
languages, it translates to English and Bangla, then analyses the English
translation. Uncertain language detection or a failed translation does not
produce a successful result. Translations and analysis are validated before
returning, and each translation is labeled by target language. The Worker
does not fetch URLs from messages.

Provider calls have an eight-second timeout per stage and bounded response
size. Missing credentials, timeouts, rate limits, provider failures, and
malformed responses return explicit `error` or `unavailable` responses.
Provider details and credentials are not logged or included in API responses.
The API uses `Cache-Control: no-store`.

Worker tests mock the provider or `fetch`; CI does not require a real key or
make requests to Groq.
