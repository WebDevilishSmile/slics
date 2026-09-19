# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

SLICs replaces a paper binder that UPS Feeder drivers used to look up destination addresses/phone numbers. A driver enters a SLIC code and gets the address, a tap-to-open Google Maps link, a tap-to-call phone number, and driver-submitted comments about that location. It's a live production app used daily (not a demo), so changes to auth, data integrity, and the admin CRUD flows have real user impact — see `README.md` for the full product context.

## Commands

- `npm run dev` — start dev server (Next.js with Turbopack)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint (`next/core-web-vitals` config)

There is no test suite configured in this repo.

## Architecture

**Stack:** Next.js 15 (App Router) + React 19, MongoDB (native driver, no ODM), NextAuth v5 (beta) for auth, MUI v7 for components, Tailwind for utility classes alongside MUI's `sx` prop, Emotion as the styling engine under MUI.

**Path alias:** `@/*` maps to the repo root (e.g. `@/lib/db`, `@/utils/slicsApi`, `@/auth`).

### Data layer

- `lib/db.ts` exports a single shared `MongoClient` instance (cached on `global` in dev to survive HMR). Every data-access module imports this client directly — there is no repository abstraction beyond the `utils/*Api.js` files.
- Domain data access lives in `utils/*Api.js` (`slicsApi.js`, `usersApi.js`, `commentsApi.js`, `driversApi.js`, `coverBidJobsApi.js`, `slicHistoryApi.js`). API routes call these instead of touching collections directly, though some inline routes (e.g. `comment` DELETE) still query `client.db()` directly for simple lookups.
- All data-access modules now call `client.db()` with no argument (unified in `SUGGESTIONS.md` #10). `MONGODB_URI` has no db name in its path, so the driver's implicit default (`test`) was already what every `client.db('test')` call resolved to — the rename was behavior-preserving, not a data migration.
- Mutations to `slics` go through `createSlic`/`updateSlic` in `utils/slicsApi.js`, which also write an audit trail via `utils/slicHistoryApi.js` (`addSlicHistoryEntry`, `diffSlicFields`). Don't bypass these with raw `updateOne` calls for anything a user should see in history.
- Timestamps are `new Date().toISOString()` on write in most newer code (`created_at`, `updated_at`); some older code stored `MM/DD/YY` strings instead, so don't assume the field is always a parseable ISO string without checking the source.

### Auth

NextAuth v5 is split across two files because of Edge runtime constraints:
- `auth.config.js` — Edge-safe config only (OAuth providers, JWT/session callbacks that don't touch the DB). Used by `middleware.js`.
- `auth.js` — full config: adds the Credentials provider (bcrypt password check), `MongoDBAdapter`, and JWT/session callbacks that hit the database for fresh `role`/`bmcMember`/`comments`. Used everywhere else (API routes, server components) via `import { auth } from '@/auth'`.

Route protection happens at two levels:
- `middleware.js` — redirects unauthenticated users to `/signin` for non-public paths, and separately gate-keeps `bmcMember`-only routes (e.g. `/history`).
- Inside API routes — every mutating handler must independently check `const session = await auth()` and `session.user.role === 'admin'` where required. Middleware does not protect `/api/*`; each route does its own check (see `app/api/slic/[id]/route.js` for the standard pattern). Never trust a client-supplied `userId`/`role` in a request body — always derive identity from `session.user`.

Roles: `user` and `admin` on `session.user.role`. Membership tier is `session.user.bmcMember` (Buy Me a Coffee supporter — unlocks `/history`, set via `app/api/webhooks/buymeacoffee`).

### API routes

Standard shape for `app/api/**/route.js` (see `app/api/slic/[id]/route.js`, `app/api/comment/route.js`):
1. `await auth()` and check session/role first for anything mutating.
2. Validate route params / body, returning `NextResponse.json({ error }, { status })` on failure (400/401/403/404).
3. Delegate to a `utils/*Api.js` function inside a `try/catch`; log with `console.error` and return 500 on unexpected failure.

Error response bodies are inconsistent across routes — some use `{ error }`, others `{ message }` (tracked in `SUGGESTIONS.md` #14). Check the specific route's existing shape before adding a caller.

Rate limiting (`utils/rateLimit.js`) is a MongoDB-backed fixed-window limiter, deliberately **fail-open** (allows the request through if Mongo is unreachable — a limiter outage must not take down sign-up/commenting). Key it by user id where an authenticated action should be per-driver-not-per-network (drivers share building wifi), by IP for pre-auth endpoints like registration.

### Frontend structure

- `app/<route>/page.jsx` are route entry points; `app/components/<feature>/` holds the components for that feature area, mirroring route names (`admin/`, `bids/`, `comments/`, `covers/`, `drivers/`, `slicPage/`, etc.).
- `app/components/layout/Providers.jsx` is the client-side provider tree: `SessionProvider` → MUI `AppRouterCacheProvider` → `ThemeProvider` (+ `CssBaseline`).
- Theme is `utils/theme.js` (MUI `createTheme` with `colorSchemes.dark`, `cssVariables: { colorSchemeSelector: 'class' }`, `responsiveFontSizes`). Four custom palette keys exist beyond MUI's defaults, each defined in both schemes: `background.opposite` / `text.opposite` (the mode toggle), `background.comment` (comment surfaces), and `text.light` (footer/header text on the primary color). Reuse these — or MUI's own keys — rather than hardcoding hex colors in components; add a new key in both `palette` and `colorSchemes.dark.palette` if you need another. Raw color values live in the `tokens` object at the top of `utils/theme.js`.
- Shared constants (page sizes, layout dimensions, example doc shapes for reference) live in `utils/variables.js`.
- Custom hooks live in `utils/clientFunctions.js` (`'use client'` module) — e.g. `useIsMobile`, `useGeolocation`, `useAppleDevice`. Prefer adding new cross-component browser-state hooks here over duplicating logic in a component.
- `app/context/CommentRefreshContext.js` exists but is currently unused/dead code (`SUGGESTIONS.md` #13) — don't assume it's wired up.

### External integrations

- **Google Gemini** (`@google/genai`, `GEMINI_API_KEY`) — used by `app/api/coverBidJobs/extract` for extracting structured data.
- **Vercel Blob** (`@vercel/blob`, `BLOB_READ_WRITE_TOKEN` — injected by Vercel once the store is connected to the project; `vercel env pull` locally) — stores the per-slic directions PDF. `lib/blob.js` is the only module that talks to it; `app/api/slic/[id]/pdf` (admin-only, keyed by `numSlic`) uploads/removes and saves the resulting `slic.pdfUrl` through `updateSlic` so history records it. Every upload gets a random-suffix URL and the old blob is deleted afterwards — never overwrite in place (CDN cache). **Migration in progress:** PDFs used to live in a public Supabase bucket, flagged by the legacy `slic.pdf` boolean. `home/PdfLink.jsx` prefers `pdfUrl` and falls back to the Supabase URL (`legacyPdfUrl` in `utils/variables.js`) when only `pdf` is set, so nothing breaks mid-migration. Don't remove the fallback or `$unset` `pdf` until the Supabase bucket is retired — `scripts/migratePdfsToBlob.js` / `scripts/rollbackPdfUrls.js` are the forward/reverse paths.
- **Buy Me a Coffee webhook** (`app/api/webhooks/buymeacoffee`, `BMC_WEBHOOK_SECRET`) — toggles `bmcMember` on the user record.
- **Vercel Analytics** — pageview/usage data referenced in `README.md`.

## Known issues / conventions to be aware of

`SUGGESTIONS.md` is a live, checked-off punch list of security/perf/quality issues found in this codebase — check it before assuming an area is already fixed, and check items off as they're addressed. Notably still open: duplicate SLIC form components in `newSlic/` vs `createEditSlic/` (#11), the SLIC PATCH/DELETE ID-field mismatch (#12), and inconsistent API error shapes (#14).

`THEME.md` is the equivalent punch list for styling — read it before changing anything visual. `THEME.md` #1–#3 are done, so the theme is no longer inert: `<body>` carries `font.variable`, meaning `theme.typography.fontFamily` now controls the body font (to change the app font, swap the `next/font` loader in `app/layout.jsx`), and `MuiButton` is a single key again. Two conventions worth keeping: **one key per component** in `theme.components` — duplicate keys replace rather than merge, silently — and **palette paths like `'primary.dark'` only work in `sx`**, never in `styleOverrides` or `variants[].style`, where they emit invalid CSS the browser drops. Use a theme callback (`({ theme }) => ({ color: theme.vars.palette… })`) in those positions. Note `MuiButton` deliberately sets no colors; MUI's own variant styling is already color-prop-aware (see the comment in `utils/theme.js`). Colors have a single source of truth: the MUI theme. `app/globals.css` and `tailwind.config.mjs` define no palette of their own (`THEME.md` #10); CSS that needs a theme color reads MUI's emitted variables (`var(--mui-palette-…)`), which already follow the color scheme.
