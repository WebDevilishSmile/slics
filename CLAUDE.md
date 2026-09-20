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
- All data-access modules now call `client.db()` with no argument (unified in `docs/SUGGESTIONS.md` #10). `MONGODB_URI` has no db name in its path, so the driver's implicit default (`test`) was already what every `client.db('test')` call resolved to — the rename was behavior-preserving, not a data migration.
- Mutations to `slics` go through `createSlic`/`updateSlic` in `utils/slicsApi.js`, which also write an audit trail via `utils/slicHistoryApi.js` (`addSlicHistoryEntry`, `diffSlicFields`). Don't bypass these with raw `updateOne` calls for anything a user should see in history. `updateSlic`/`deleteSlic`/`getSlicById` are keyed by `_id` (so `app/api/slic/[id]` means `_id` for every method); `numSlic` is immutable after creation because comments, `slic_history` and `slicViews` are keyed by it — `updateSlic` rejects a change and the edit form renders the field read-only.
- Timestamps are `new Date().toISOString()` on write in most newer code (`created_at`, `updated_at`); some older code stored `MM/DD/YY` strings instead, so don't assume the field is always a parseable ISO string without checking the source.

### Auth

NextAuth v5 is split across two files because of Edge runtime constraints:
- `auth.config.js` — Edge-safe config only (OAuth providers, JWT/session callbacks that don't touch the DB). Used by `middleware.js`.
- `auth.js` — full config: adds the Credentials provider (bcrypt password check), `MongoDBAdapter`, and JWT/session callbacks that hit the database for fresh `role`/`bmcMember`/`comments`. Used everywhere else (API routes, server components) via `import { auth } from '@/auth'`.

The `auth.js` JWT callback returns `null` when the user row no longer exists, which makes Auth.js clear the session cookie — so deleting a `users` row (self-service via `DELETE /api/users/[userId]`, or by hand) signs that user out everywhere on their next request. A *failed* lookup (Mongo unreachable) keeps the existing token on purpose; don't collapse the two cases. The middleware's Edge callback has no DB lookup, so it still lets the request reach the page; the page's own `auth()` is what returns `null`.

Route protection happens at two levels:
- `middleware.js` — redirects unauthenticated users to `/signin` for non-public paths, and separately gate-keeps `bmcMember`-only routes (e.g. `/history`).
- Inside API routes — every mutating handler must independently check `const session = await auth()` and `session.user.role === 'admin'` where required. Middleware does not protect `/api/*`; each route does its own check (see `app/api/slic/[id]/route.js` for the standard pattern). Never trust a client-supplied `userId`/`role` in a request body — always derive identity from `session.user`.

Roles: `user` and `admin` on `session.user.role`. Membership tier is `session.user.bmcMember` (Buy Me a Coffee supporter — unlocks `/history`, set via `app/api/webhooks/buymeacoffee`).

### API routes

Standard shape for `app/api/**/route.js` (see `app/api/slic/[id]/route.js`, `app/api/comment/route.js`):
1. `await auth()` and check session/role first for anything mutating.
2. Validate route params / body, returning `NextResponse.json({ error }, { status })` on failure (400/401/403/404).
3. Delegate to a `utils/*Api.js` function inside a `try/catch`; log with `console.error` and return 500 on unexpected failure.

Every error response (status ≥ 400) has the body `{ error: string }` — clients read `data.error` and nothing else (`docs/SUGGESTIONS.md` #14). Keep the string human-readable and don't include the raw caught error (`error.message`) in the body; it's already `console.error`'d server-side. Success bodies are not standardized: some routes return `{ success: true, data }`, some `{ message }`, some the document itself — check the route before adding a caller.

Rate limiting (`utils/rateLimit.js`) is a MongoDB-backed fixed-window limiter, deliberately **fail-open** (allows the request through if Mongo is unreachable — a limiter outage must not take down sign-up/commenting). Key it by user id where an authenticated action should be per-driver-not-per-network (drivers share building wifi), by IP for pre-auth endpoints like registration.

### Frontend structure

- `app/<route>/page.jsx` are route entry points; `app/components/<feature>/` holds the components for that feature area, mirroring route names (`admin/`, `bids/`, `comments/`, `covers/`, `drivers/`, `slicPage/`, etc.).
- `app/components/layout/Providers.jsx` is the client-side provider tree: `SessionProvider` → MUI `AppRouterCacheProvider` → `ThemeProvider` (+ `CssBaseline`).
- Theme is `utils/theme.js` (MUI `createTheme` with `colorSchemes.dark`, `cssVariables: { colorSchemeSelector: 'class' }`, `responsiveFontSizes`). Four custom palette keys exist beyond MUI's defaults, each defined in both schemes: `background.opposite` / `text.opposite` (the mode toggle), `background.comment` (comment surfaces), and `text.light` (footer/header text on the primary color). Reuse these — or MUI's own keys — rather than hardcoding hex colors in components; add a new key in both `palette` and `colorSchemes.dark.palette` if you need another. Raw color values live in the `tokens` object at the top of `utils/theme.js`.
- Shared constants (page sizes, layout dimensions, example doc shapes for reference) live in `utils/variables.js`.
- Spacing in `sx` uses MUI spacing numbers, never rem strings: `mt: 2` is 1rem/16px (`theme.spacing` is the 8px default, root font size is the browser default). That applies to `m*`/`p*`/`gap*` and their responsive objects only — heights, `top`/`left` offsets and `fontSize` still take rem strings, because a bare number *there* means pixels. Plain `style={{ }}` objects (only `app/global-error.jsx`) are outside MUI and keep rem.
- Page-level widths come from the `theme.layout.width` scale (`docs/THEME.md` #19): `field` 30rem (a form control column), `panel` 32rem (the content column), `prose` 40rem (readable text), `wide` 55rem (sign-in/membership messaging, admin tables), `page` 1436px (`PageContainer`). Use `maxWidth: theme.layout.width.<step>` — never a new rem literal, and don't add a sixth step for a one-off; snap to the nearest. Table-cell/icon widths are component-local and not part of the scale.
- The main content panel is `<Paper variant='panel'>` (defined in `utils/theme.js`, `docs/THEME.md` #17); call sites add only their delta (`justifyContent: 'center'`, `px: 2`). Don't re-inline the width/min-height/flex block.
- Page and section titles are `<Typography variant='sectionHeading'>` (`docs/THEME.md` #18) — h2 plus the uppercase/800/centered treatment, defined as a `MuiTypography` variant in `utils/theme.js` and rendered as an `<h2>`. There is no heading wrapper component anymore; the app name on `/` and `/home` is a plain `variant='h1'` to keep the "SLICs" casing.
- Custom hooks live in `utils/clientFunctions.js` (`'use client'` module) — e.g. `useIsMobile`, `useGeolocation`, `useAppleDevice`. Prefer adding new cross-component browser-state hooks here over duplicating logic in a component.
- `app/context/CommentRefreshContext.js` is the refresh lock for the *server-rendered* comment lists (profile page, admin user page): `CommentDelete` calls its `refresh()` (a `useTransition` around `router.refresh()`) and every delete button in the list disables while `isRefreshing`. The home-page `components/comments/*` feature is client-fetched and refreshes through its own `refetchComments` prop instead — the two don't share state.

### External integrations

- **Google Gemini** (`@google/genai`, `GEMINI_API_KEY`) — used by `app/api/coverBidJobs/extract` for extracting structured data.
- **Vercel Blob** (`@vercel/blob`, `BLOB_READ_WRITE_TOKEN` — injected by Vercel once the store is connected to the project; `vercel env pull` locally) — stores the per-slic directions PDF. `lib/blob.js` is the only module that talks to it; `app/api/slic/[id]/pdf` (admin-only, `[id]` = the slic `_id` like the parent route) uploads/removes and saves the resulting `slic.pdfUrl` through `updateSlic` so history records it. Every upload gets a random-suffix URL and the old blob is deleted afterwards — never overwrite in place (CDN cache). **Migration in progress:** PDFs used to live in a public Supabase bucket, flagged by the legacy `slic.pdf` boolean. `home/PdfLink.jsx` prefers `pdfUrl` and falls back to the Supabase URL (`legacyPdfUrl` in `utils/variables.js`) when only `pdf` is set, so nothing breaks mid-migration. Don't remove the fallback or `$unset` `pdf` until the Supabase bucket is retired — `scripts/migratePdfsToBlob.mjs` / `scripts/rollbackPdfUrls.mjs` (`npm run pdfs:migrate` / `pdfs:rollback`, both with `--dry-run`) are the forward/reverse paths.
- **Buy Me a Coffee webhook** (`app/api/webhooks/buymeacoffee`, `BMC_WEBHOOK_SECRET`) — toggles `bmcMember` on the user record.
- **Vercel Analytics** — pageview/usage data referenced in `README.md`.

### PWA / home-screen install

The app is installable (manifest + HTTPS) but deliberately has **no service worker** — installability no longer requires one, and a stale cache is the one PWA failure that outlives a deploy. If one is ever added: register it in production only and keep page navigations network-first. The manifest is `app/manifest.js` (served at `/manifest.webmanifest`, `start_url: '/home'`); the home-screen icons (`app/apple-icon.png`, `public/maskable-icon-*.png`) come from `npm run icons:generate` (`scripts/generateIcons.mjs`, opaque white tile + inset because the source mark is transparent) — regenerate, never hand-edit. Install detection is `useInstallPrompt` in `utils/clientFunctions.js`: Chrome's `beforeinstallprompt` is stashed on `window.__slicsInstallPrompt` by an inline script in `app/layout.jsx` (it can fire before hydration); iOS has no prompt, so `app/components/install/IosInstallDialog.jsx` shows the Share → "Add to Home Screen" steps instead. The nudge on `/home` snoozes itself via `localStorage` for 30 days; the header-menu entry is the permanent path.

## Known issues / conventions to be aware of

`docs/SUGGESTIONS.md` is a checked-off punch list of security/perf/quality issues found in this codebase — every item is now done, but the entries still document the reasoning behind a lot of current conventions (auth checks per route, `_id`-keyed slic routes, `{ error }` bodies), so read the relevant item before changing one of those areas. `docs/STRUCTURE.md` is the still-open list for file/folder organization and API path naming. The SLIC create/edit form and its field components live in `app/components/slicForm/` (one `SlicForm` with a `mode` prop); generic fields shared across features (currently `PhoneField`) live in `app/components/form/`.

`docs/THEME.md` is the equivalent punch list for styling — read it before changing anything visual. `docs/THEME.md` #1–#3 are done, so the theme is no longer inert: `<body>` carries `font.variable`, meaning `theme.typography.fontFamily` now controls the body font (to change the app font, swap the `next/font` loader in `app/layout.jsx`), and `MuiButton` is a single key again. Two conventions worth keeping: **one key per component** in `theme.components` — duplicate keys replace rather than merge, silently — and **palette paths like `'primary.dark'` only work in `sx`**, never in `styleOverrides` or `variants[].style`, where they emit invalid CSS the browser drops. Use a theme callback (`({ theme }) => ({ color: theme.vars.palette… })`) in those positions. Note `MuiButton` deliberately sets no colors; MUI's own variant styling is already color-prop-aware (see the comment in `utils/theme.js`). Colors have a single source of truth: the MUI theme. `app/globals.css` and `tailwind.config.mjs` define no palette of their own (`docs/THEME.md` #10); CSS that needs a theme color reads MUI's emitted variables (`var(--mui-palette-…)`), which already follow the color scheme.
