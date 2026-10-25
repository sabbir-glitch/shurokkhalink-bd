# ShurokkhaLink BD — deployment notes

## Current hosted demonstration

- Public URL: https://shurokkhalink-bd.sabbirahamedmail.workers.dev/
- Git repository: https://github.com/sabbir-glitch/shurokkhalink-bd
- Production branch: `main`
- Build command: `npm run build`
- Deploy command in Cloudflare: `npx wrangler deploy`
- Application build output: `dist/`

The current project was created through the Cloudflare Workers Git-connected workflow. These instructions refer to that Worker deployment, not a Cloudflare Pages project.

## Current deployment workflow

1. Make and review local changes.
2. Run `npm run test:run`, `npm run lint`, and `npm run build` locally.
3. Check `git status --short` and review the exact file changes.
4. Commit the intended changes and push to `main`:

   ```powershell
   git add <reviewed-files>
   git diff --cached --check
   git diff --cached --stat
   git commit -m "Describe the change"
   git push origin main
   ```

5. Confirm that the GitHub Actions CI workflow passes.
6. Open Cloudflare Workers & Pages, select `shurokkhalink-bd`, and inspect the build/deployment history. Confirm that the new deployment completed successfully.
7. Open the live URL and test the changed functionality.

Do not run `git add -A` blindly when unrelated or unexpected files are present. Do not commit `.env` files, secrets, `node_modules`, or generated `dist/` files.

## Build configuration

The Cloudflare dashboard currently shows the GitHub repository `sabbir-glitch/shurokkhalink-bd`, production branch `main`, build command `npm run build`, and deploy command `npx wrangler deploy`. The project root is the repository root. To enable AI analysis, configure `GROQ_API_KEY` as a Cloudflare Worker Secret separately; never add it to repository files, Vite/frontend environment variables, or `wrangler.jsonc`. Without the secret, the AI API remains unavailable. See [`worker/README.md`](worker/README.md) for details.

`public/_headers` is copied into `dist/_headers` by the Vite build. The live response was checked on 24 October 2026 and included Content Security Policy, Permissions Policy, Referrer Policy, `X-Content-Type-Options`, and `X-Frame-Options`. Cloudflare Workers documents custom `_headers` rules for static-asset responses; changes to Worker-generated responses may need headers set in Worker code instead. See the official [Cloudflare Workers headers documentation](https://developers.cloudflare.com/workers/static-assets/headers/).

## Zero-cost operating rules

- Keep the project on the available free GitHub and Cloudflare offerings.
- Use the supplied `workers.dev` hostname; no custom domain is needed.
- Do not enable paid services, add paid integrations, or buy a domain without checking the cost and obtaining explicit approval.
- Do not enable paid billing or paid fallbacks. If free provider usage is unavailable or exhausted, keep the API unavailable rather than enabling paid usage.

## Important limitations

A successful deployment confirms that the build/deploy job completed; it does not certify the application as secure or establish real-world phishing-detection accuracy. Recheck the live page, network behavior, response headers, and relevant browser/accessibility behavior after material changes.
