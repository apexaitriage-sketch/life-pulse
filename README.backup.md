# Life Pulse

Life Pulse is a no-signup interactive daily planner that turns completed tasks into a live Life Score, life-balance signal, mood-aware strategy, streaks and replay history.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Cloudflare Pages

Use Git integration (GitHub) rather than dashboard Direct Upload because this project contains Pages Functions under `/functions`.

Build command: `npm run build`
Output directory: `dist`

## Dodo environment variables

Set these in Cloudflare encrypted secrets/environment variables:

- `DODO_PAYMENTS_API_KEY`
- `DODO_PAYMENTS_WEBHOOK_SECRET`
- `DODO_PAYMENTS_ENVIRONMENT` (`test_mode` or `live_mode`)

Product IDs are embedded in `src/main.jsx` and validated server-side in the checkout endpoint.

## Dodo webhook endpoint

After Cloudflare gives you the final domain:

`https://YOUR-DOMAIN.com/api/dodo/webhook`

Do not put API keys or webhook secrets in GitHub.

## SEO

Update the `canonical` URL, `robots.txt`, and `sitemap.xml` placeholders after you know the real domain. The homepage includes semantic metadata, Open Graph/Twitter metadata and WebApplication JSON-LD.
