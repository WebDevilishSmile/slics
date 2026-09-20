# STRUCTURE.md

A punch list for the repo's file and folder layout. Companion to `SUGGESTIONS.md`
(security/perf/quality) and `THEME.md` (styling) — this one tracks *where things live*,
what's dead, and what's named inconsistently. Where an item overlaps one of those lists it
says so and defers to it, so nothing is tracked twice.

**How to use this:** every item is independent unless it says `Depends on:`. Pick one, do
it, check the box. Each item states its *blast radius*. Tiers are ordered by urgency, not
by how "structural" they are — Tier 0 is data hygiene, not layout.

**Before shipping any item:** there is no test suite in this repo. Run `npm run build`
after every move or delete — an import path you missed is a build error, not a runtime
surprise. For items that rename routes (Tier 4) click through the affected screens too.
The app is used daily in production.

---

## Why this list exists

Three files in `utils/` hold real driver PII and have been in git for nine months. About
40 tracked files are dead — boilerplate SVGs, duplicate icons, a carousel nobody renders,
a Stripe client with no Stripe dependency. `utils/` mixes server repositories, a rate
limiter, client hooks, the MUI theme, constants and seed data in one flat folder.
Component imports are split 52/60 between relative paths and the `@/app/components`
alias. API routes use two casings and four names for "the id".

None of that breaks the app. All of it makes the repo harder to hand to someone else —
or to yourself in six months.

---

## Tier 0 — Sensitive data in the repo

Do these first, before any refactor. Nothing else on this list matters if the repo is
carrying employee phone numbers.

### 1. Delete the hardcoded driver roster

- [ ] **Files:** `utils/random.js` (1,520 lines), `utils/random2.js` (1,109 lines),
  `app/components/drivers/EditDriversData.jsx`

`random.js` exports `allDrivers`: ~270 real drivers with full name, employee ID, seniority
date and personal phone number. `random2.js` is the same dataset as a bare object literal
(not even a valid module — nothing imports it). Both were input to `EditDriversData.jsx`,
a one-shot browser script that reformats the array and dumps JSON to the console for
pasting into Mongo. Its only reference is a commented-out JSX tag at
`app/admin/drivers/page.jsx:16`.

The data is in the `drivers` collection now. Delete all three files and the commented tag.
Future one-shot migrations belong in `scripts/` as Node scripts (like `createIndexes.js`)
reading from a **gitignored** input file — never as a React component importing a data
module.

*Blast radius:* none at runtime. See item 4 for history.

### 2. Delete the seed comments and the data-manipulation stub

- [ ] **Files:** `utils/comments.js` (995 lines), `app/components/home/DataManipulation.jsx`

`comments.js` is a 2023 export of the comments table including user emails, avatar URLs
and user IDs. Its only importer is `DataManipulation.jsx`, which is imported by nothing,
contains only commented-out code, and also imports `@/utils/allHubs`, `@/utils/centers`
and `@/utils/customers` — none of which exist. It would throw on first render if anyone
ever wired it up.

*Blast radius:* none.

### 3. Remove the bid sheet from `public/`

- [ ] **Files:** `public/data/2026-spring-jobs.csv`, `public/data/2026-spring-jobs.xlsx`

Everything under `public/` is served unauthenticated. These two files are reachable at
`/data/2026-spring-jobs.csv` by anyone with the URL, bypass the sign-in gate entirely, and
are referenced by no code. The extract flow reads uploads from the request body, not from
disk. Delete the folder.

*Blast radius:* none.

### 4. Scrub git history if the repo is (or was ever) public

- [ ] **Decision, then possibly:** `git filter-repo` + force-push

The remote is `github.com/WebDevilishSmile/slics` and `README.md` reads as a portfolio
piece. Items 1–2 were added in commits `1e1c42e` (2025-05-30), `72f113f` (2025-05-31) and
`ad72ca0` (2025-12-20) and are in every clone since. Deleting the files in HEAD does not
remove them from history.

If the repo has ever been public: rewrite history to drop the three files, force-push,
and treat the roster as disclosed regardless. If it has always been private: deleting in
HEAD is enough, but still do items 1–3 so a future "make public" toggle isn't a leak.

*Blast radius:* a history rewrite invalidates every existing clone. Fine for a solo repo.

### 5. Add `.env.example` and resolve the Azure AD provider

- [ ] **Files:** create `.env.example`; review `auth.config.js:19-21`

The code reads eleven env vars. `.env` defines seven. The three `AUTH_AZURE_AD_*` values
used by the Microsoft provider in `auth.config.js` are not among them, so locally that
provider is constructed with `undefined` credentials. Either it's live in production
(then document it) or it's abandoned (then delete the provider block and
`app/.well-known/microsoft-identity-association.json/route.js`).

`.env.example` should list every key with a blank or placeholder value and a one-line
comment. It's the first file a new contributor — or you on a new machine — looks for.

```
MONGODB_URI=
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_AZURE_AD_ID=
AUTH_AZURE_AD_SECRET=
AUTH_AZURE_AD_TENANT_ID=
GEMINI_API_KEY=
BMC_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
```

*Blast radius:* none.

### 6. Drop the CORS block in `vercel.json`

- [ ] **File:** `vercel.json`

Every `/api/*` response carries `Access-Control-Allow-Origin: *` together with
`Access-Control-Allow-Credentials: true`. Browsers reject that combination for
credentialed requests, so it does nothing useful — and nothing calls this API
cross-origin. It only signals that the API is meant to be open. Delete the `headers`
array; if nothing else remains, delete the file.

*Blast radius:* none. Verify by confirming no `fetch` in the codebase targets an absolute
URL to your own API from another origin (there is none today).

---

## Tier 1 — Dead files and dependencies

Pure deletion. Every item here has been verified to have zero importers.

### 7. Delete three dead modules

- [ ] `lib/stripe.js` — imports the `stripe` package, which is **not in `package.json`**.
  Zero importers. Would crash on import.
- [ ] `utils/pdfs.js` — an array of PDF filenames. Zero importers.
- [x] `app/context/CommentRefreshContext.js` — this is `SUGGESTIONS.md` #13. Resolved
  there by keeping it: it's now the `useTransition`-backed refresh lock for the
  profile/admin comment lists, not dead code.

*Blast radius:* none.

### 8. Delete five dead components (and what only they used)

- [ ] `app/components/home/EmblaCarousel.jsx` — zero importers. Taking it out also frees:
  - the `embla-carousel-react` dependency (its only import is inside this file)
  - all eleven `public/carousel_*.png` / `.jpeg` files (the component built the path
    dynamically as `/carousel_N.png`; the `.jpeg` copies were never reachable)
  - the `.embla*` rules in `app/globals.css:95-229` (~135 lines, 60% of the file)
- [ ] `app/components/home/AllHubsButton.jsx` — zero importers.
- [ ] `app/components/home/MoreDetailsLink.jsx` — only reference is a commented-out tag at
  `home/SlicDisplay.jsx:39`. Delete both.
- [ ] `app/components/admin/users/UserCardActions.jsx` — zero importers.
- [x] `app/components/newSlic/NewSlicForm.jsx` — zero importers. `admin/new/page.jsx`
  already uses `createEditSlic/SlicForm`, so `SUGGESTIONS.md` #11 is done **except this
  deletion**. Note that #11 says to delete NewSlicForm "and its sub-components" — don't.
  `SlicForm.jsx` still imports ten of them, and `profile/EditProfileDialog.jsx` imports
  `PhoneField`. See item 23 for where they should live.

`layout/StyledPage.jsx` and `layout/Wrapper.jsx` are also dead but are `THEME.md` #22.
Not double-tracked.

*Blast radius:* none.

### 9. Remove two dead dependencies

- [ ] `crypto` — this is a deprecated 2016 placeholder package on npm, not Node's
  built-in. `import crypto from 'crypto'` in `app/api/webhooks/buymeacoffee/route.js`
  resolves to the builtin regardless of whether the package is installed. Remove it from
  `package.json`; the import stays.
- [ ] `embla-carousel-react` — `Depends on:` item 8.

Then `npm install` to update the lockfile.

*Blast radius:* none.

### 10. Clean out `public/`

- [ ] **Files:** 34 files in `public/`; 6 are referenced.

Delete:

| File | Why |
|---|---|
| `next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg` | create-next-app boilerplate |
| `Screen Shot 2025-12-26 at 11.40.02 AM.png` | stray screenshot |
| `road.jpg` | unreferenced |
| `bmc-brand-icon.png`, `bmc-brand-icon.svg`, `bmc-brand-logo.png` | only `bmc-brand-logo.svg` is used |
| `slics_logo2.png`, `slics_logo_only.png` | only `slics-logo.png` and `slics_logo_dark.png` are used |
| `apple-touch-icon.png`, `favicon-16x16.png`, `favicon-32x32.png` | superseded by `app/favicon.ico` + `app/apple-icon.png` conventions |
| `site.webmanifest` | see item 12 |
| `carousel_*` (11 files) | `Depends on:` item 8 |
| `data/` | item 3 |

Keep: `android-chrome-192x192.png`, `android-chrome-512x512.png`,
`maskable-icon-192x192.png`, `maskable-icon-512x512.png` (all referenced by
`app/manifest.js`; the maskable pair is generated by `npm run icons:generate`),
`bmc-brand-logo.svg`, `slics-logo.png` (source for the generated icons),
`slics_logo_dark.png`.

While here: `slics-logo.png` vs `slics_logo_dark.png` — pick one separator.

- [ ] **Add two files that are referenced but missing.** `admin/users/UserCard.jsx:203`
  falls back to `/default-avatar.png` and `profile/ProfileImage.jsx:19` to
  `/default-profile.png`. Neither exists in `public/`, so a user with no OAuth image gets
  a 404 and a broken `<img>`. Add one placeholder and point both at it.

*Blast radius:* none for the deletions. The missing-file fix changes what credentials
users without a Google avatar see on two screens — for the better.

### 11. Delete the non-convention icon copies in `app/`

- [x] **Files:** `app/android-chrome-192x192.png`, `app/android-chrome-512x512.png`,
  `app/apple-touch-icon.png`, `app/favicon-16x16.png`, `app/favicon-32x32.png`

Next.js treats exactly these filenames in `app/` as metadata conventions: `favicon.ico`,
`icon.*`, `apple-icon.*`, `opengraph-image.*`, `twitter-image.*`, `manifest.*`,
`robots.*`, `sitemap.*`. Anything else in `app/` that isn't a route segment is **not
served** — it's just a file sitting in the source tree. The five above are byte-for-byte
copies of the ones in `public/` and do nothing.

Keep `app/favicon.ico` and `app/apple-icon.png` — those are the real ones.

*Blast radius:* none.

### 12. Delete both stale `site.webmanifest` files

- [x] **Files:** `app/site.webmanifest`, `public/site.webmanifest`

Both are identical, with `"name": ""` and `"short_name": ""`. `app/manifest.js` is the
real manifest (Next serves it at `/manifest.webmanifest` and links it from `<head>`). The
`public/` copy is served at `/site.webmanifest` but linked from nowhere; the `app/` copy
isn't served at all (item 11).

*Blast radius:* none. Confirm `<link rel="manifest">` in a built page points to
`/manifest.webmanifest`.

### 13. Config nits

- [ ] `tailwind.config.mjs:3-7` — `content` globs include `./pages/**` and
  `./components/**`, neither of which exists. Trim to `./app/**/*.{js,jsx}` (and add
  `./components/**` back once item 21 is done). The `theme.extend.colors` block in the
  same file is `THEME.md` #10.
- [ ] `app/page.jsx:9` — imports `RedirectMessage`, never uses it.
- [ ] `.gitignore` — add `.claude/settings.local.json`. It's untracked today, but only by
  luck; `settings.json` is the shared one and should stay tracked.

*Blast radius:* none.

### 14. Run `knip` once, then keep it

- [ ] `npx knip` after items 7–13.

It reports unused files, exports and dependencies across the whole project and will catch
whatever this list missed. Consider adding it as `"lint:dead": "knip"` in `package.json`
so the next audit is one command.

---

## Tier 2 — Split `utils/` by responsibility

Today `utils/` (18 files after Tier 0/1) holds: nine server-side Mongo modules, a
server-only rate limiter, client-side React hooks, the MUI theme, layout constants, and a
147-line `functions.js` with 27 importers that mixes string formatters with Mongo→JSON
serializers. The `*Api.js` suffix is also misleading — those modules *are* the data layer,
not clients of some API.

Target layout:

```
lib/
  db/
    client.js         ← lib/db.ts (see item 32)
    slics.js          ← utils/slicsApi.js
    slicHistory.js    ← utils/slicHistoryApi.js
    slicViews.js      ← utils/slicViewsApi.js
    users.js          ← utils/usersApi.js
    comments.js       ← utils/commentsApi.js
    drivers.js        ← utils/driversApi.js + utils/drivers.js
    covers.js         ← utils/covers.js
    coverBidJobs.js   ← utils/coverBidJobsApi.js
    bidJobs.js        ← utils/bidFunctions.js
  rateLimit.js        ← utils/rateLimit.js
  serializers.js      ← serialize* from utils/functions.js
  format.js           ← the rest of utils/functions.js
hooks/
  useIsMobile.js      ← utils/clientFunctions.js
  useAppleDevice.js   ← utils/clientFunctions.js
theme.js              ← utils/theme.js
constants.js          ← utils/variables.js
```

Do each item as its own commit: `git mv`, then a find-and-replace on the import string,
then `npm run build`. Each is independently revertible.

### 15. Move the data-access modules to `lib/db/` and drop the `Api` suffix

- [ ] **Files:** `utils/slicsApi.js`, `slicHistoryApi.js`, `slicViewsApi.js`,
  `usersApi.js`, `commentsApi.js`, `driversApi.js`, `coverBidJobsApi.js` → `lib/db/*.js`

Each has between 1 and 11 importers. `lib/db.ts` becomes `lib/db/client.js` in the same
move (29 importers of `@/lib/db` → `@/lib/db/client`).

*Blast radius:* import paths only. Zero logic change.

### 16. Merge the single-function collection modules

- [ ] `utils/drivers.js` (`getAllDrivers`, 1 importer) → into `lib/db/drivers.js`. Two
  files for one collection.
- [ ] `utils/covers.js` (`getCovers`, 1 importer) → `lib/db/covers.js`.
- [ ] `utils/bidFunctions.js` (`getAllBidJobs` + two serializers, 1 importer) →
  `lib/db/bidJobs.js`; move `serializeBidJob(s)` to `lib/serializers.js` (item 17).

*Blast radius:* import paths only.

### 17. Split `utils/functions.js`

- [ ] **File:** `utils/functions.js` (27 importers) → `lib/serializers.js` +
  `lib/format.js`

Lines 30–125 are `serialize{Slic,SlicHistory,User,Comment,SlicView,Cover,Driver}(s)` —
all "turn `ObjectId`/`Date` into strings so it survives the server→client boundary".
Lines 2–24 and 135–147 are `formatPhoneNumber`, `capitalizeWords`,
`capitalizeFirstLetter`, `getUpcomingSaturday`, `isMobileDevice` — unrelated.

Splitting means a page that only serializes doesn't import phone formatting, and the
serializer file is the obvious place to look when a new collection appears.

*Blast radius:* import paths only. Most importers use one or the other group, not both.

### 18. Move the hooks to `hooks/`

- [ ] **File:** `utils/clientFunctions.js` (2 importers) → `hooks/useIsMobile.js`,
  `hooks/useAppleDevice.js`

It's a `'use client'` module living next to server-only Mongo code. Also the home for
`app/components/admin/coverBidJobs/useCoverBidJobs.js` (item 27). `THEME.md` #29 wants
`useIsMobile` rebased on theme breakpoints — do that in the same touch if convenient.

*Blast radius:* import paths only.

### 19. Move `theme.js` and `variables.js` to the root

- [ ] `utils/theme.js` (5 importers) → `theme.js`
- [ ] `utils/variables.js` (22 importers) → `constants.js`

Neither is a "utility". `THEME.md` #11 folds the layout constants (`MAX_WIDTH`,
`BORDER_RADIUS`, `ELEVATION`…) into the theme; after that `constants.js` holds only
`SLICS_PER_PAGE`, `COVER_BID_MONTHS_BACK` and the three `*_EXAMPLE` document shapes. Those
example shapes are documentation, not code — consider moving them to
`docs/DATA_MODEL.md` and deleting the constants.

*Blast radius:* import paths only.

### 20. Retire `utils/`

- [ ] `rmdir utils` — `Depends on:` items 1, 2, 7, 15–19.

`grep -rn "@/utils/" app auth.js auth.config.js middleware.js` must return nothing.

---

## Tier 3 — Components: one location, names that match routes, no duplicates

### 21. Move `app/components/` to `components/` and use one import style

- [ ] **Files:** `app/components/**` → `components/**`; every importer

Today: 52 imports use relative paths (`'../components/...'`, `'./components/...'`), 60 use
`'@/app/components/...'`. Two styles for the same thing, chosen per file. Moving the folder
out of `app/` does two things: `app/` becomes purely the route tree (which is what the App
Router intends), and the alias `'@/components/...'` becomes the only sensible spelling.

Mechanical: `git mv app/components components`, then a find-and-replace of
`@/app/components/` → `@/components/` over `app/`, then fix the 52 relative imports by
hand or with a second pattern per depth. Update the `tailwind.config.mjs` content glob
(item 13).

`Depends on:` nothing, but do it **before** items 22–27 so the renames happen once.

*Blast radius:* every import of a component. Build will catch every miss.

### 22. Rename feature folders to mirror their routes

- [ ] **Folder renames inside `components/`:**

| Current | Proposed | Why |
|---|---|---|
| `slicPage/` | `slic/` | serves `app/home/[slic]` |
| `admin/user-page/` | fold into `admin/users/` | only kebab-case folder in the tree; serves `admin/users/[id]` |
| `utility/HydrationGuard.jsx` | `layout/HydrationGuard.jsx` | single-file folder |
| `home/RedirectMember.jsx`, `home/MemberDisplay.jsx` | `signIn/` | used by `app/page.jsx` (the landing), not by `/home` |
| `admin/slics/TableHeader.jsx` | `admin/slics/SlicsTableHeader.jsx` | generic name in a specific folder |
| `covers/DriverTableHead.jsx` | `covers/CoverDriversTableHead.jsx` | see item 24 |

*Blast radius:* import paths only.

### 23. Merge `newSlic/` and `createEditSlic/` into `slicForm/`

- [x] **Folders:** `components/newSlic/` (10 field components after item 8),
  `components/createEditSlic/` (3 files)

After item 8 there is no "new SLIC form" — `SlicForm.jsx` handles both modes and imports
its ten fields from a sibling folder named after a form that no longer exists. Move
`SlicForm.jsx`, `SlicAuditInfo.jsx`, `SlicHistoryList.jsx` and the ten fields into one
`slicForm/` folder. `PhoneField.jsx` is also used by `profile/EditProfileDialog.jsx` — it's
a generic field; put it in `components/form/PhoneField.jsx` so neither feature owns it.

*Blast radius:* import paths only. This closes out `SUGGESTIONS.md` #11.

### 24. Rename the colliding `DriversTable`

- [ ] **Files:** `covers/DriversTable.jsx` → `covers/CoverDriversTable.jsx`;
  `covers/DriverTableHead.jsx` → `covers/CoverDriversTableHead.jsx`

`drivers/DriversTable.jsx` and `covers/DriversTable.jsx` are different components with the
same name. Two files named `DriversTable` in one codebase means every import and every
stack trace needs the folder to disambiguate. The `covers/` one also uses singular
`DriverTableHead` next to `drivers/DriversTableHead` — same component concept, different
plurality.

*Blast radius:* import paths only.

### 25. Collapse the `about/` wrappers

- [ ] **Files:** `about/AboutContainer.jsx` (12 lines), `AboutImage.jsx` (49),
  `AboutLink.jsx` (36), `AboutText.jsx` (12), `AboutTitle.jsx` (9)

Five single-purpose wrappers for one static page, each imported only by the four section
components next to them. `AboutText` and `AboutTitle` are a `Typography` with a `variant`
prop. Fold them into the sections that use them, or into one `AboutSection.jsx` if the
repetition is real. Ten files → five.

*Blast radius:* the About page only. `THEME.md` #25 touches two of the sections.

### 26. Three comment renderers → one

- [ ] **Files:** `comments/Comment.jsx` + `CommentHeader.jsx` + `CommentFooter.jsx`;
  `profile/CommentHeader.jsx` + `CommentBody.jsx` + `CommentFoot.jsx` +
  `CommentDelete.jsx`; `admin/comments/Comment.jsx`

Same document shape, three implementations. The profile version has its own
`CommentHeader` that collides by name with the `comments/` one. The admin version is a
third `Comment.jsx`.

Consolidate on `comments/Comment.jsx` with props for what varies (`showSlicLink`,
`onDelete`, `canVote`). The profile and admin pages then render `<Comment variant=…>`.
This is the largest item in the tier — do it last, after the moves, and click through
`/home?slic=…`, `/profile/[id]` and `/admin/comments` in both modes.

*Blast radius:* three screens. Real refactor, not a move.

### 27. Move non-components out of component folders

- [ ] `admin/coverBidJobs/useCoverBidJobs.js` → `hooks/useCoverBidJobs.js`
- [ ] `admin/coverBidJobs/coverBidJobRow.js` → `lib/coverBidJobRow.js` (or fold into
  `lib/db/coverBidJobs.js` if it's a serializer)
- [ ] `coverBidJobs/dayFormat.js` → `lib/format.js` (item 17)

Three `.js` files with lowercase names in folders where everything else is a
PascalCase `.jsx`. They stand out because they don't belong.

*Blast radius:* import paths only.

### 28. Dedupe `home/page.jsx` and `all/page.jsx`; rename `/all`

- [ ] **Files:** `app/home/page.jsx`, `app/all/page.jsx`

The two pages are ~90% identical: same auth guard, same `searchParams.slic` handling,
same `Comments`/`Main` composition. They differ in `getAllSlics()` vs `getAllHubs()` and
the heading. Extract `components/slic/SlicLookupPage.jsx` taking `slics`, `heading` and
`user`, and have both routes render it.

Separately, `/all` says nothing about what's on it. `/hubs` does. Rename the route folder
and add a `redirects()` entry in `next.config.mjs` from `/all` → `/hubs` (`permanent:
true`) so any driver with it bookmarked isn't stranded.

*Blast radius:* the redirect protects bookmarks. `AllHubsButton` (item 8) is the only
thing that linked to `/all` and it's dead; grep for `'/all'` to confirm nothing else does.

---

## Tier 4 — API route naming

Do this tier together with `SUGGESTIONS.md` #14 (error-shape consistency), since that
already means opening every route file. Deploy all renames in **one** release: a driver
with a stale PWA tab could call an old path for a few minutes after deploy, so avoid a
window where the client and server disagree for longer than that.

Today's paths, grouped:

```
comment          comments          comments/[commentId]    comments/[commentId]/vote
slic/[id]        slics             newSlic
coverBidJob/[id] coverBidJobs      coverBidJobs/extract    coverBidJobs/weeks
user/track-view  user/view-history user/views
users/[userId]   users/[userId]/add-phone   users/[userId]/toggle-member   …/toggle-role
cover/[position] drivers           drivers/[id]
```

Singular *and* plural for the same collection; camelCase (`coverBidJobs`) *and*
kebab-case (`track-view`) in one API; `[id]`, `[userId]`, `[commentId]` and `[position]`
for the item segment.

### 29. Plural collection, `[id]` item

- [ ] `api/newSlic` → `POST api/slics` (already exists for GET; add the method)
- [ ] `api/slic/[id]` → `api/slics/[id]`
- [ ] `api/comment` → `POST api/comments` (already exists for GET; add the method)
- [ ] `api/comments/[commentId]` → `api/comments/[id]` (and `/vote`)
- [ ] `api/coverBidJob/[id]` → `api/coverBidJobs/[id]`
- [ ] `api/users/[userId]` → `api/users/[id]` (and its three sub-routes)

Each rename is one `grep -rn "'/api/<old>"` over `app/` and `components/` to find the
`fetch` calls. (`SUGGESTIONS.md` #12 — the PATCH-by-`numSlic` / DELETE-by-`_id` mismatch on
the SLIC route — is already done; `[id]` means `_id` for every method, so the `slic/[id]`
rename is purely a folder move plus its three `fetch` paths.)

*Blast radius:* every client `fetch` to a renamed path. Grep is exhaustive here — there
is no dynamic path construction except the `[id]` segment.

### 30. One casing for URL segments

- [ ] `api/coverBidJobs/**` → `api/cover-bid-jobs/**` (matches the page route
  `/cover-bid-jobs`, which is already kebab)

Everything else is either one word or already kebab (`track-view`, `add-phone`,
`toggle-role`). Kebab is the conventional choice for URLs; camelCase segments are the odd
ones out.

*Blast radius:* four route folders, their `fetch` callers.

### 31. Current-user routes under `users/me`

- [ ] `api/user/track-view`, `api/user/view-history`, `api/user/views` →
  `api/users/me/track-view`, `api/users/me/view-history`, `api/users/me/views`

`user/` (singular, current session) next to `users/[id]` (any user, admin) is a common
REST idiom but only when it's spelled `me`. As is, `user` vs `users` looks like a typo.

*Blast radius:* three routes, their callers.

---

## Tier 5 — Root and tooling

### 32. Decide on TypeScript

- [ ] **File:** `lib/db.ts` — the only `.ts` file in the repo; there is no
  `tsconfig.json`

It compiles because SWC transpiles `.ts` regardless, but nothing type-checks it.
`@types/node` in devDependencies and `npx tsc --noEmit` in `.claude/settings.json` suggest
a TS migration was started and stopped at one file.

Two honest options:

1. **Rename to `lib/db.js`** (part of item 15). Drop `@types/node`. The repo is a JS
   codebase; be one. *Recommended now.*
2. **Commit to TS**: add `tsconfig.json` with `allowJs: true` and `strict: true`, keep
   `db.ts`, and migrate `lib/db/*` first since the Mongo document shapes are where types
   pay off most. That's a project of its own; track it as a separate list if chosen.

*Blast radius:* option 1, none. Option 2, ongoing.

### 33. Move the punch lists into `docs/`

- [ ] `SUGGESTIONS.md`, `THEME.md` → `docs/` (this file is already there)
- [ ] Update the two references in `CLAUDE.md` ("Known issues / conventions")
- [ ] Add a line to `CLAUDE.md` pointing at `docs/STRUCTURE.md`

`README.md` and `CLAUDE.md` stay at the root — tooling and GitHub look for them there.
Everything else that's prose goes in `docs/`.

*Blast radius:* none.

### 34. Lint for unused imports and exports

- [ ] **File:** `eslint.config.mjs`

`next/core-web-vitals` alone doesn't flag unused imports — which is how `lib/stripe.js`,
the `RedirectMessage` import and five dead components survived. Add
`eslint-plugin-unused-imports` (or enable `no-unused-vars` with `"args": "none"`) so the
next one is caught at lint time. Item 14's `knip` covers whole-file deadness; this covers
the in-file kind.

*Blast radius:* none at runtime; expect a handful of lint errors on first run.

### 35. `package.json` metadata

- [ ] Add `"engines": { "node": ">=20.6" }` — `db:indexes` uses `node --env-file`, which
  needs 20.6+. Vercel respects this field.
- [ ] Add `"description"`.
- [ ] Bump `"version"` off `0.1.0`. Two years in production is not 0.1.

*Blast radius:* none.

### 36. README placeholders

- [ ] `README.md:5` — `[Live demo link coming soon]`. Fill in or remove.

---

## Verification

**Before Tier 0:** confirm what's in history, so you know what item 4 is scrubbing.

```bash
git log --diff-filter=A --format="%h %ad" --date=short -- utils/random.js utils/random2.js utils/comments.js
```

**Before deleting anything in Tier 1 — all should return nothing:**

```bash
# item 7
grep -rn "lib/stripe\|utils/pdfs" app utils lib auth.js auth.config.js middleware.js
# item 8 — each name should appear only in its own file, or in a comment
grep -rn "EmblaCarousel\|AllHubsButton\|MoreDetailsLink\|UserCardActions\|NewSlicForm'" app --include=*.jsx --include=*.js
# item 10 — every public/ asset that is referenced
grep -rhoE "'/[A-Za-z0-9_-]+\.(png|svg|jpe?g|ico|webmanifest)'" app | sort -u
```

**After Tier 2:**

```bash
grep -rn "@/utils/" app auth.js auth.config.js middleware.js   # nothing
ls utils                                                        # gone
```

**After item 21:**

```bash
grep -rn "from '\.\./.*components/\|from '\./components/\|@/app/components" app components   # nothing
```

**After Tier 4:** for each old path, `grep -rn "'/api/<old>"` over `app/` and
`components/` must be empty before deploy.

**For every item:** `npm run build`. A moved file with a missed importer fails the build;
that is the test suite this repo has.
