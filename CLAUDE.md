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

Environment variables: `.env.example` lists every key the code reads, with a one-line comment each — copy it to `.env` and fill it in. It is the only `.env*` file that is tracked (`.gitignore` has `!.env.example`); keep it current when a `process.env.*` read is added or removed.

## Architecture

**Stack:** Next.js 15 (App Router) + React 19, MongoDB (native driver, no ODM), NextAuth v5 (beta) for auth, MUI v7 for components, Tailwind for utility classes alongside MUI's `sx` prop, Emotion as the styling engine under MUI.

**Path alias:** `@/*` maps to the repo root (e.g. `@/lib/db`, `@/utils/slicsApi`, `@/auth`).

### Data layer

- `lib/db.ts` exports a single shared `MongoClient` instance (cached on `global` in dev to survive HMR). Every data-access module imports this client directly — there is no repository abstraction beyond the `utils/*Api.js` files.
- Domain data access lives in `utils/*Api.js` (`slicsApi.js`, `usersApi.js`, `commentsApi.js`, `driversApi.js`, `coverBidJobsApi.js`, `slicHistoryApi.js`, `gymsApi.js`, `placesApi.js`). API routes call these instead of touching collections directly, though some inline routes (e.g. `comment` DELETE) still query `client.db()` directly for simple lookups.
- All data-access modules now call `client.db()` with no argument (unified in `docs/SUGGESTIONS.md` #10). `MONGODB_URI` has no db name in its path, so the driver's implicit default (`test`) was already what every `client.db('test')` call resolved to — the rename was behavior-preserving, not a data migration.
- Mutations to `slics` go through `createSlic`/`updateSlic` in `utils/slicsApi.js`, which also write an audit trail via `utils/slicHistoryApi.js` (`addSlicHistoryEntry`, `diffSlicFields`). Don't bypass these with raw `updateOne` calls for anything a user should see in history. `updateSlic`/`deleteSlic`/`getSlicById` are keyed by `_id` (so `app/api/slic/[id]` means `_id` for every method); `numSlic` is immutable after creation because comments, `slic_history` and `slicViews` are keyed by it — `updateSlic` rejects a change and the edit form renders the field read-only.
- `/admin/planet-fitness` is the admin's personal list of truck-accessible gyms (`utils/gymsApi.js`, `app/components/gyms/`, `/api/gyms*` and `/api/gym-comments*`, all admin-only). Its comments live in their own `gymComments` collection, deliberately *not* `comments`: everything that reads `comments` assumes a `numSlic`. Gyms are tagged with the numSlics they're on the way to (`gym.slics`), and the page sorts them by straight-line distance from the browser's location (`utils/geo.js`). Nothing geocodes; pins are pasted from Google Maps or taken from GPS.
- `/whip-it-in-and-out` (name may change) is the driver-wide version: **places** any signed-in driver can add (`utils/placesApi.js`, `app/components/places/`, `/api/places*`, `/api/place-comments*`, collections `places`/`placeComments`). Its rules:
  - Only the driver who added a place, or an admin, can edit or delete it. Once another driver has commented, only an admin can delete it.
  - Comments are **plain text**, never rendered as HTML. Threads are one level deep: a reply-to-a-reply is filed under the thread's top-level comment.
  - A top-level comment that still has replies is soft-deleted to a "Comment deleted" placeholder. The placeholder goes when its last reply does.
  - `placesApi` shapes data for the client: first name + avatar, vote counts + `myVote`, and `isMine`/`addedByMe` flags. Other drivers' user ids never leave the server.
  - Account deletion calls `deleteUserPlaceData`. Places stay, unattributed.
  - The header-menu link is admin-only until launch (`header/UserMenu.jsx`).
  - Shared with gyms: `form/SlicTagsField.jsx`, `utility/PlaceLinks.jsx`, `utils/apiRequest.js`.
- SLIC comments ("Driver tips", `utils/commentsApi.js`, `app/components/comments/`) mirror the places rules:
  - Threads are one level deep. A reply has `parentId` (its top-level comment) and keeps `numSlic`, so per-SLIC counts and profile lists include replies.
  - Since 2026-10-07 tips are **plain text** (`format: 'text'`). Older comments are Tiptap HTML with no `format`, and `comments/CommentContent.jsx` renders both. Render comment bodies through it, never `html-react-parser` directly. Editing an old HTML comment saves it as plain text.
  - A top-level comment deleted while it has replies becomes a `deleted: true` placeholder. Every read except `getSlicThread` filters `deleted: { $ne: true }`.
  - `GET /api/comments?slic=` returns the shaped thread: first name + avatar, counts, `myVote`, `isMine`. User ids don't leave the server.
  - Votes toggle: `voteType: null` takes your vote back.
  - The Tips button gets live and "new since last visit" counts from `utils/tipsStore.js`.
- `slicViews` (one row per lookup, `{ userId: ObjectId, numSlic, viewedAt: Date }`) backs both the /home lookup counter and the member `/history` page (`utils/slicViewsApi.js`, `app/components/history/`, `/api/user/history*`). Rows can carry a private `note` and `hidden: true`. "Remove from history" only hides a row, so history reads filter `hidden: { $ne: true }` while the counter (`/api/user/views`, `track-view`) deliberately counts every row. Account deletion deletes them all.
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
- Theme is `utils/theme.js` (MUI `createTheme` with `colorSchemes.dark`, `cssVariables: { colorSchemeSelector: 'class' }`, `responsiveFontSizes`). Three custom palette keys exist beyond MUI's defaults, each defined in both schemes: `background.comment` (comment surfaces), `text.light` (footer/header text on the primary color), and `bmc` (the Buy Me a Coffee button, `color='bmc'` via `layout/BmcButton.jsx`). `background.opposite`/`text.opposite` were pruned when the floating mode toggle moved into the menu. Reuse these — or MUI's own keys — rather than hardcoding hex colors in components; add a new key in both `palette` and `colorSchemes.dark.palette` if you need another. Raw color values live in the `tokens` object at the top of `utils/theme.js`. The lookup card and the Driver tips use a soft, embossed look instead of Paper elevations: the shadow pairs are `theme.soft` (`raised`, `raisedSmall`, `inset`, one value per scheme). The sx helpers are in `app/components/utility/soft.js` (only inside a `<Paper variant='panel'>`, whose surface they match): `softRaised`, `softInset`, `softInputSx` (a pressed-in TextField with a placeholder, not a floating label) and `softPressSx` (pressed in while held or `aria-pressed`). Soft elements take the panel's own surface, overlay included, so only light and shadow set them apart.
- Shared constants (page sizes, layout dimensions, example doc shapes for reference) live in `utils/variables.js`.
- Spacing in `sx` uses MUI spacing numbers, never rem strings: `mt: 2` is 1rem/16px (`theme.spacing` is the 8px default, root font size is the browser default). That applies to `m*`/`p*`/`gap*` and their responsive objects only — heights, `top`/`left` offsets and `fontSize` still take rem strings, because a bare number *there* means pixels. Plain `style={{ }}` objects (only `app/global-error.jsx`) are outside MUI and keep rem.
- Page-level widths come from the `theme.layout.width` scale (`docs/UI-SUGGESTIONS.md` #19): `field` 30rem (a form control column), `panel` 32rem (the content column), `prose` 40rem (readable text), `wide` 55rem (sign-in/membership messaging, admin tables), `page` 1436px (`PageContainer`). Use `maxWidth: theme.layout.width.<step>` — never a new rem literal, and don't add a sixth step for a one-off; snap to the nearest. Table-cell/icon widths are component-local and not part of the scale.
- The main content panel is `<Paper variant='panel'>` (defined in `utils/theme.js`, `docs/UI-SUGGESTIONS.md` #17); call sites add only their delta (`justifyContent: 'center'`, `px: 2`). Don't re-inline the width/min-height/flex block.
- Page and section titles are `<Typography variant='sectionHeading'>` (`docs/UI-SUGGESTIONS.md` #18) — h2, centered and capped at prose width, defined as a `MuiTypography` variant in `utils/theme.js` and rendered as an `<h2>`. It no longer uppercases (#38), so write each title in the casing it should show ("SLICs", "SLIC History"). There is no heading wrapper component anymore; the app name on `/` and `/home` is a plain `variant='h1'`.
- Custom hooks live in `utils/clientFunctions.js` (`'use client'` module) — e.g. `useGeolocation`, `useAppleDevice`, `useInstallPrompt`. For "is this a phone", use `useMediaQuery(theme.breakpoints.down('sm'))` against the theme's breakpoints; the old `useIsMobile` hook (a private 768px cutoff) was removed in `docs/UI-SUGGESTIONS.md` #29. Prefer adding new cross-component browser-state hooks here over duplicating logic in a component.
- `app/context/CommentRefreshContext.js` is the refresh lock for the *server-rendered* comment lists (profile page, admin user page): `CommentDelete` calls its `refresh()` (a `useTransition` around `router.refresh()`) and every delete button in the list disables while `isRefreshing`. The home-page "Driver tips" section (`components/comments/Comments.jsx`) is client-fetched and refetches its own thread instead — the two don't share state.

### Visual style: soft / embossed (match it in every UI change)

Since 2026-10-07 the app's look is a **soft, embossed (neumorphic) style in the existing colors**. The lookup card, the SLIC search bar and the Driver tips use it. **Any UI you add or change should match it**, not the older outlined/elevated MUI look. Restyle what you touch, and say so in the summary. The rules:

- **Inside a `<Paper variant='panel'>`**, build with the helpers in `app/components/utility/soft.js`:
  - `softRaised` for cards and tiles;
  - `softRaisedSmall` for pills and chips;
  - `softInset` for wells (an address, a reply list, a sort track);
  - `softInputSx` for text fields, which are wells with a placeholder (never a floating label) and the `softFocus` glow on focus;
  - `softPressSx` for anything tappable, which presses in while held and stays pressed while `aria-pressed`.

  Soft elements share the panel's surface, so light and shadow do the separating: no borders, no outlined variants, no extra Paper `elevation`. On the page background, use the same surface as a raised element: see the search bar in `home/SlicsSearch.jsx`.
- **Color stays the theme's.** One solid brand-blue (`primary`, contained) element per card, its main action, sitting on `theme.soft.raisedSmall` instead of MUI's drop shadow. Everything else is surface-colored with `primary.main` icons and text. Status colors (error, the red "new" badge) keep their meaning. The shadow values are `theme.soft` in `utils/theme.js`; tune them there, never per component.
- **Classy, not gimmicky.** Generous radii (16px cards and tiles, pill chips), even spacing (`gap` 1.5–3) so shadows have room, and restraint: one emboss level per element, never a raised card on a raised card. Nested content goes in an inset well.
- **Don't trade away accessibility for the look.** A pressed or selected state also changes the icon (filled vs outlined) or the color, not just the shadow. Focus rings stay visible. Touch targets stay at least 40–48px. Text keeps AA contrast.
- **Loading states** are `<Skeleton>`s shaped like the content, inside the same soft shapes (`home/SlicCardSkeleton.jsx`, `layout/LoadingFallback.jsx`). No "Loading..." text.
- **Check light and dark at phone width** for every change. The dark scheme's emboss is subtler by design.

### External integrations

- **Google Gemini** (`@google/genai`, `GEMINI_API_KEY`) — used by `app/api/coverBidJobs/extract` for extracting structured data.
- **Vercel Blob** (`@vercel/blob`, `BLOB_READ_WRITE_TOKEN` — injected by Vercel once the store is connected to the project; `vercel env pull` locally) — stores the per-slic directions PDF. `lib/blob.js` is the only module that talks to it; `app/api/slic/[id]/pdf` (admin-only, `[id]` = the slic `_id` like the parent route) uploads/removes and saves the resulting `slic.pdfUrl` through `updateSlic` so history records it. Every upload gets a random-suffix URL and the old blob is deleted afterwards — never overwrite in place (CDN cache). **Migration in progress:** PDFs used to live in a public Supabase bucket, flagged by the legacy `slic.pdf` boolean. `slicPdfHref` in `utils/variables.js` (used by the PDF button in `home/SlicActions.jsx`) prefers `pdfUrl` and falls back to the Supabase URL (`legacyPdfUrl`, same file) when only `pdf` is set, so nothing breaks mid-migration. Don't remove the fallback or `$unset` `pdf` until the Supabase bucket is retired — `scripts/migratePdfsToBlob.mjs` / `scripts/rollbackPdfUrls.mjs` (`npm run pdfs:migrate` / `pdfs:rollback`, both with `--dry-run`) are the forward/reverse paths.
- **Buy Me a Coffee webhook** (`app/api/webhooks/buymeacoffee`, `BMC_WEBHOOK_SECRET`) — toggles `bmcMember` on the user record.
- **Vercel Analytics** — pageview/usage data referenced in `README.md`.

### PWA / home-screen install

The app is installable (manifest + HTTPS) but deliberately has **no service worker** — installability no longer requires one, and a stale cache is the one PWA failure that outlives a deploy. If one is ever added: register it in production only and keep page navigations network-first. The browser/status-bar color is `statusBarColors` in `utils/theme.js` (the header's color in each scheme, computed, never a literal): `app/layout.jsx` emits a light/dark `themeColor` pair and `layout/ThemeColorSync.jsx` re-points both metas when a driver pins a mode with the menu switch. The manifest is `app/manifest.js` (served at `/manifest.webmanifest`, `start_url: '/home'`); the home-screen icons (`app/apple-icon.png`, `public/maskable-icon-*.png`) come from `npm run icons:generate` (`scripts/generateIcons.mjs`, opaque white tile + inset because the source mark is transparent) — regenerate, never hand-edit. Install detection is `useInstallPrompt` in `utils/clientFunctions.js`: Chrome's `beforeinstallprompt` is stashed on `window.__slicsInstallPrompt` by an inline script in `app/layout.jsx` (it can fire before hydration); iOS has no prompt, so `app/components/install/IosInstallDialog.jsx` shows the Share → "Add to Home Screen" steps instead. The nudge on `/home` snoozes itself via `localStorage` for 30 days; the header-menu entry is the permanent path.

## Known issues / conventions to be aware of

`docs/SUGGESTIONS.md` is a checked-off punch list of security/perf/quality issues found in this codebase — every item is now done, but the entries still document the reasoning behind a lot of current conventions (auth checks per route, `_id`-keyed slic routes, `{ error }` bodies), so read the relevant item before changing one of those areas. `docs/STRUCTURE.md` is the still-open list for file/folder organization and API path naming. The SLIC create/edit form and its field components live in `app/components/slicForm/` (one `SlicForm` with a `mode` prop); generic fields shared across features (currently `PhoneField`) live in `app/components/form/`.

`docs/UI-SUGGESTIONS.md` (called `THEME.md` until 2026-10-03; item numbers unchanged) is the equivalent punch list for styling and UI. Read it before changing anything visual. Part 1 (#1–#30) is theme plumbing. Part 2 (#31+) is a UI review: accessibility, phone layout, the lookup screen, motion and navigation, with a suggested order at its top. Part 1 is complete (2026-10-07); its rules still apply. Text sizes come from Typography variants (`variant=` or `typography:` in `sx`), never one-off `fontSize` rem values; icon sizes are exempt. Layers come from `theme.zIndex` by name (e.g. `zIndex: 'stickyBar'`). `layout/Container.jsx` owns the full-height shell, and `PageContainer` is only the content column. The fixed header is cleared by an empty `<Toolbar />` spacer in `header/Header.jsx`, not by page margins. `HomeButton`/`BackButton` sit in the page flow, so render them as the first child of `PageContainer` (#37). Because #1–#3 are done, the theme is no longer inert: `<body>` carries `font.variable`, meaning `theme.typography.fontFamily` now controls the body font (to change the app font, swap the `next/font` loader in `app/layout.jsx`), and `MuiButton` is a single key again. Two conventions worth keeping: **one key per component** in `theme.components` — duplicate keys replace rather than merge, silently — and **palette paths like `'primary.dark'` only work in `sx`**, never in `styleOverrides` or `variants[].style`, where they emit invalid CSS the browser drops. Use a theme callback (`({ theme }) => ({ color: theme.vars.palette… })`) in those positions. Note `MuiButton` deliberately sets no colors; MUI's own variant styling is already color-prop-aware (see the comment in `utils/theme.js`). Colors have a single source of truth: the MUI theme. `app/globals.css` and `tailwind.config.mjs` define no palette of their own (`docs/UI-SUGGESTIONS.md` #10); CSS that needs a theme color reads MUI's emitted variables (`var(--mui-palette-…)`), which already follow the color scheme.
