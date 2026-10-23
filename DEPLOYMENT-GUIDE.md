# Static online demonstration deployment

## Recommendation

Use **Cloudflare Pages with Git integration** for this Vite frontend. It can
build the existing project and host the resulting static files over HTTPS,
without a backend or a new application dependency. A build produces `dist/`;
`public/_headers` is copied into that directory for Pages to apply as HTTP
response headers.

Official setup references:

- [Cloudflare Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Cloudflare Pages build image and Node.js versions](https://developers.cloudflare.com/pages/configuration/build-image/)
- [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Cloudflare Pages headers](https://developers.cloudflare.com/pages/configuration/headers/)
- [Cloudflare Pages serving and SPA behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/)
- [Cloudflare HSTS settings](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/)

## Prepare the source

1. Review the local changes and run the project checks below.
2. From your own normal Git workflow, commit and push the reviewed project to
   the Git provider/repository you choose. No commit or push is performed by
   this guide or by this task.
3. Keep the repository root as the Pages root directory. No environment
   secrets, API keys, or application variables are required.

## Create the Pages project in the dashboard

1. Sign in to Cloudflare and open **Workers & Pages**.
2. Choose **Create application** / **Create project**, then select **Pages**
   and **Connect to Git**.
3. Connect the Git provider, authorize the repository, and select the
   ShurokkhaLink BD repository.
4. Set the build configuration:

   | Setting                | Value                                       |
   | ---------------------- | ------------------------------------------- |
   | Framework preset       | Vite (or React/Vite)                        |
   | Production branch      | The branch you pushed and intend to publish |
   | Root directory         | `/` (repository root)                       |
   | Build command          | `npm run build`                             |
   | Build output directory | `dist`                                      |

5. Set `NODE_VERSION` to `24.22.1` for both production and preview builds if
   the dashboard provides separate environments. `.nvmrc` already pins this
   version locally; the explicit variable avoids relying on the build image's
   default.
6. Save and deploy. Cloudflare Pages should install dependencies from the
   committed lockfile, run the build command, and publish only `dist/`.

No `wrangler.toml`, server-side function, API, SPA rewrite, or redirect file is
needed for the current root-only application. Pages serves the SPA root for
unmatched paths when there is no top-level `404.html`; if client-side routes
are added later, verify the behavior again.

For a one-off manual demo, Pages also offers Direct Upload of a prebuilt
`dist/` directory. Cloudflare documents that Direct Upload projects cannot
later be switched to Git integration; choose Git integration if you want
repeatable builds from a branch.

## Headers and hosting caveats

`public/_headers` asks Pages to apply a restrictive Content Security Policy:
same-origin scripts/styles/assets, no network connections from the app, no
forms submitted to a destination, and no framing. It also disallows camera,
microphone, and geolocation access and sets common response hardening headers.
This policy is appropriate to the current bundled app; if you later add
external fonts, scripts, APIs, or other resources, review and deliberately
update the policy rather than broadly relaxing it.

Pages `_headers` rules apply to static asset responses. They do not set headers
on Pages Functions responses; this project has no Functions. Cloudflare also
documents default headers such as `Access-Control-Allow-Origin: *` for static
assets. Those assets are public application files, but inspect the actual
deployed response headers before release.

HTTPS is provided for the `pages.dev` hostname. Do not enable HSTS preload or
`includeSubDomains` casually. For a custom domain, first verify certificate
issuance, HTTPS redirects, all intended subdomains, and the ability to keep
HTTPS available. Configure HSTS at the Cloudflare zone only after confirming
its scope and recovery implications. HSTS is intentionally not hard-coded in
the Pages `_headers` file.

This app does not submit analyzed text or URLs. Visitors still make ordinary
network requests to download the site, and the hosting provider necessarily
handles delivery requests and associated connection metadata. Review the
provider's current privacy, logging, retention, account-access, and domain
configuration before publishing. Application source inspection is not a
guarantee about browser extensions, provider infrastructure, or the deployed
runtime.

## Verify the deployed demonstration

After deployment:

1. Open the HTTPS deployment URL in a private browser window and confirm that
   the Bangla-first app loads without mixed-content or CSP errors.
2. Check the OTP, prize, and HTTPS-link examples in Bangla and English. The
   link example should show link presence as informational, not a fraud
   verdict.
3. Edit analyzed input and confirm old results disappear; clear the form and
   confirm both input and results are gone.
4. Inspect the browser Network panel while analyzing each sample. Message
   analysis should make no request containing the message or submitted URL.
   Requests for the site’s own HTML, JS, CSS, and icon assets are expected.
5. Inspect the deployed HTML, JS, CSS, and favicon response headers. Confirm
   the CSP and other headers from `public/_headers` are present and that no
   unexpected external scripts, fonts, analytics, or API destinations load.
6. Exercise keyboard navigation and visible focus. Test the deployed page at
   narrow mobile widths, including 320–375 CSS pixels. If possible, also test
   with actual screen-reader software; automated component tests do not replace
   this.

## Project checks before publishing

```sh
npm run test:run
npm run build
npm run lint
npm run format:check
```

This deployment path creates a shareable static demonstration; it does not
make the rule-based analyzer a fraud detector, verify senders or destinations,
or certify links as safe. Complete the outstanding manual, production-header,
privacy, operational-ownership, and local-language reviews in
[RELEASE-READINESS.md](./RELEASE-READINESS.md) before treating the site as a
public production service.
