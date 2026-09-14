# Remove Cloudflare code from the project

## What Cloudflare code exists today

- `package.json` — the `@cloudflare/vite-plugin` dependency (line 15).
- `wrangler.jsonc` — Cloudflare deployment config file (compatibility date/flags, entry point).
- `vite.config.ts` — comments mentioning Cloudflare (comments only, no active code).
- `supabase/migrations/20260815_phase2_operational_schema.sql` — one comment mentioning a "Cloudflare Cron Trigger" (comment only).

There is **no** actual Cloudflare connector code, gateway calls, or API usage anywhere in `src/` — the app itself does not talk to Cloudflare.

## What will be removed

1. Delete `wrangler.jsonc`.
2. Remove `@cloudflare/vite-plugin` from `package.json` dependencies.
3. Clean up the Cloudflare mention in `vite.config.ts` comments.

## What will be kept (to avoid breaking the app)

- `src/server.ts` stays as-is: it is the site's server entry point. Its `fetch(request, env, ctx)` shape is generic; it contains no Cloudflare-specific code and the app will not start without it.
- The old SQL migration comment is left untouched — editing already-applied database history risks breaking the database.

## Verification

- Run the typecheck/build after removal and confirm `/tmp/observability/build-errors.log` shows no new errors.
- Check the preview loads at `/` with no runtime errors.
- If the build fails because the underlying framework still expects Cloudflare config, the fallback is to keep `wrangler.jsonc` (it is only config, no code) and report that to you instead of forcing the removal.

## Technical note

The project's build tooling (`@lovable.dev/vite-tanstack-config`) already bundles its own Cloudflare plugin internally as part of the platform; the removal above only strips the extra project-level Cloudflare pieces that were added on top. That internal platform piece cannot be removed without breaking the hosting environment itself.
