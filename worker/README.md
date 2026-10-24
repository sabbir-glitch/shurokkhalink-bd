# AI API foundation

The Cloudflare Worker handles `/api/*` requests and delegates other requests to
the static assets binding. The current Worker does **not** connect to an AI
provider. `GET /api/ai/status` reports `configured: false`, and a valid
`POST /api/ai/analyze` request returns HTTP 503 with `status: "unavailable"`.
No mock result is used at runtime.

## Analysis request

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

Messages are limited to 10,000 JavaScript characters and request bodies to
48 KiB. All consent fields must be explicitly `true`. Browser requests with a
cross-origin `Origin` or non-same-origin `Sec-Fetch-Site` are rejected. API
responses are JSON with `Cache-Control: no-store`.

Successful provider processing is staged: `AiProvider.translate` receives a
versioned translation request, and only its validated English translation is
passed to `AiProvider.analyze`. Both outputs have versioned response types and
are validated before being returned. Provider stages receive an abort signal
and time out after eight seconds by default. Errors return an explicit
`error` or `unavailable` state; they never return a successful or safe-looking
analysis.

## Day 2 provider configuration

Implement a specific server-side provider adapter and inject it into
`createAiApi` from the Worker entry point. Keep its API credential in a
Cloudflare Worker Secret; do not use a Vite/frontend environment variable.
Set the provider timeout and response limits deliberately, document third-party
processing and retention for users, and test provider failures with mocks in
CI. Do not add URL fetching: message URLs remain text and must never be
requested by this API.

Worker tests use mocked providers and make no external requests. Build-time
TypeScript validation includes the Worker entry point.
