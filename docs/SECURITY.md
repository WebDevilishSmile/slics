# SECURITY.md

A security punch list and a set of standing rules for this repo. Companion to
`SUGGESTIONS.md` (general quality — its #1–#6 and #22 were the first security pass),
`STRUCTURE.md` (layout; its Tier 0 covers sensitive data *in the repo*) and `UI-SUGGESTIONS.md`.
Where an item overlaps one of those it says so and defers, so nothing is tracked twice.

**How to use this:** Part 1 is a threat model in one screen — read it once. Part 2 is the
findings, tiered by urgency; every item is self-contained (files, what's wrong, evidence,
fix) and independent unless it says `Depends on:`. Part 3 is the standing practices: the
rules that keep the list from growing back. Part 4 is a summary table.

**Audit scope (2026-09-20):** every file under `app/api/`, `auth.js`, `auth.config.js`,
`middleware.js`, every `lib/db/*.js`, every page under `app/`, the serializers
(`lib/serializers.js`), `lib/*`, `next.config.mjs`, `scripts/*`, `package.json` +
`npm audit`, the git history, and the production build's server-action manifest
(`.next/server/server-reference-manifest.json`). Installed at audit time: `next 15.3.6`,
`next-auth 5.0.0-beta.28`, `@auth/core 0.39.1`, `react 19.1.0`, `mongodb 6.16.0`,
`html-react-parser 5.2.5`, `bcryptjs 3.0.3`. Nothing outside the repo (Atlas, Vercel and
Google Cloud console settings) could be verified — those items are written as "confirm
that…".

**Before shipping any item:** the app is used daily in production (README: ~130
lookups/day). There is no test suite. `npm run build` after every change; for anything
touching sign-in or sessions, test both the Google and the email/password path on a phone
before pushing. Prefer additive, reversible changes with a dry-run — the pattern
`scripts/migratePdfsToBlob.mjs` already follows.

---

## Part 1 — Threat model

**What we are protecting**

| Asset | Where it lives | Who may see it (per `app/privacy/page.jsx`) |
|---|---|---|
| The SLIC dataset: every center/customer address, phone, directions PDF | `slics`, Vercel Blob, legacy Supabase bucket | Signed-in drivers only |
| User accounts: name, email, phone, bcrypt hash, role, membership | `users`, `accounts` | The user (own), the admin (all) |
| Comments and votes | `comments` | Any signed-in driver (name + avatar only) |
| Lookup history | `slicViews` | The user (own, members only), the admin |
| The driver roster: ~270 real people — name, employee ID, seniority date, personal phone; includes people with no account | `drivers` (and, today, **public git history** — see #1) | Admin; a driver linked to their own roster row |
| Cover / bid sheets (driver names, schedules) | `cover`, `cover-bid-jobs`, `bid-jobs`, Gemini API | Admin (+ member) |
| Admin capability (edit dataset, promote users, delete anything) | `users.role` | The maintainer |
| Secrets: `AUTH_SECRET`, Google OAuth, Atlas URI, Blob token, Gemini key, BMC secret | Vercel env, local `.env` | Nobody |

**Who we are protecting it from**

1. **Anyone on the internet.** Registration is open (`app/api/auth/register`) and the
   membership page says "Now that you have an account, you can access all the SLIC
   locations", so "unauthenticated attacker" and "any signed-in user" are, today, the
   same person. Every "signed-in only" check is a speed bump, not a wall — see #8.
2. **A malicious or careless signed-in driver.** Can post HTML that every other driver
   renders (#2), can call any `/api/*` route directly, shares building wifi with everyone
   else (which is why rate limits are keyed by user id where possible).
3. **A compromised admin account.** Email/password with an 8-character minimum, no MFA,
   no password reset, no lockout (#9). An admin session is full control of the dataset
   and of every other account.
4. **Third parties we hand data to:** Google (sign-in, Gemini), Vercel (hosting, Blob,
   analytics, logs), MongoDB Atlas, Buy Me a Coffee (webhook). Each is a place data can
   leak *from* if its configuration is wrong.
5. **Readers of the public GitHub repo.** `github.com/WebDevilishSmile/slics` is public
   (confirmed via the GitHub API on 2026-09-20). Every line of this codebase, every
   endpoint, and every commit ever pushed is visible.

**Where the real boundaries are**

- `middleware.js` is advisory. It skips `/api/*`, skips any path containing a `.`, and
  the installed Next.js has two published middleware-bypass advisories (#3). Treat it as
  UX (send people to sign-in), never as authorization.
- The real boundary is `await auth()` inside each route handler and page. That check
  is present in every route today (good) — but it is written `if (!session)`, which the
  installed Auth.js can fail open on (#4), and pages under `app/admin/` rely on the
  layout for it (#7).
- There is **no boundary at the data layer.** `lib/db/*.js` trust their callers
  completely, return whole documents (password hashes included), and one of them is
  itself exposed as a set of public endpoints (#5).

---

## Part 2 — Findings

### 🔴 Tier 0 — Do now

These are exploitable today by an anonymous user, or expose data that is already out.

---

### [ ] 1. Driver PII is in the public git history

**Files:** git history only (`utils/random.js`, `utils/random2.js`, `utils/comments.js`,
`app/components/drivers/EditDriversData.jsx`, `public/data/2026-spring-jobs.*`)
**Defers to:** `STRUCTURE.md` Tier 0 #4 for the mechanics. Listed here because it is the
single most serious privacy issue in the project and #4 is still unchecked.

`STRUCTURE.md` #1–#3 deleted the files from `HEAD` (commits `191d1d1`, `60a15d1`,
`94d62b3`). They are still in every commit since `ad72ca0` (2025-12-20) and `1e1c42e`
(2025-05-30), and the repo is public. Verified without printing them: the first version of
`utils/random.js` contains **253 phone-number-shaped strings**; `utils/comments.js`
contains **69 email addresses**. Anyone can `git clone` and `git show ad72ca0:utils/random.js`
right now. ~270 people, most of whom never created an account, have their name, employee
ID, seniority date and personal mobile number in a public repository.

**Fix:**
1. Rewrite history with `git filter-repo --invert-paths --path utils/random.js
   --path utils/random2.js --path utils/comments.js --path app/components/drivers/EditDriversData.jsx
   --path public/data` and force-push `main`. Delete and recreate any other branches.
2. Rewriting does not purge GitHub's caches, forks, or PR refs. Open a GitHub Support
   request ("remove sensitive data") citing the old commit SHAs so the dangling objects
   are garbage-collected server-side. Check for forks first (`/repos/.../forks`).
3. Treat the roster as disclosed regardless. Decide — as the person who holds it — whether
   the people on it should be told. The privacy policy promises to correct or remove roster
   entries on request; this is the moment to make sure that promise is easy to keep.
4. Turn on **GitHub secret scanning + push protection** on the repo (Settings → Code
   security) so a future paste of a connection string is blocked at push time.

*Blast radius:* every existing clone must be re-cloned. Fine for a solo repo.

---

### [ ] 2. Stored XSS through comments

**Files:** `app/components/comments/CommentEditor.jsx:118` (`editor.getHTML()`),
`app/api/comment/route.js` (POST — stores `content` as-is), `lib/db/comments.js`
(`createComment`), and the four render sites:
`app/components/comments/Comment.jsx:50`, `app/components/admin/comments/Comment.jsx:36`,
`app/components/profile/CommentBody.jsx:9`, `app/components/slicPage/CommentsPage.jsx:42`.

A comment is the raw HTML string TipTap produces, sent to the server, stored without
sanitization, and rendered with `html-react-parser`'s `parse()`. `parse()` is a converter,
not a sanitizer: it turns whatever HTML is in the string into real React elements. Nothing
stops a user from sending `content: '<iframe srcdoc="<script>…</script>">'` with curl —
the editor is not the boundary, the API is, and the API accepts any string.

React removes some of the danger — it will not attach a string `onerror` handler and will
not execute a `<script>` it creates — but that is where its protection ends. What still
works from a comment body rendered this way: `<iframe srcdoc>` (a fresh document that runs
scripts with the app's origin), `<a href="javascript:…">` (React only warns), `<object>`,
`<embed>`, `<meta http-equiv="refresh">`, `<form action="https://evil">` (credential
phishing inside the app's chrome), `<style>` (overlay/clickjack the vote and delete
buttons), `<img src="https://attacker/…">` (records the IP and time every driver opened
that SLIC — a privacy issue on its own). The session cookie is `HttpOnly`, so it can't be
stolen, but script running as another driver can call every `/api/*` route as them — and
if that driver is the admin, it can call `toggle-role` on the attacker's own account.

Every signed-in user can post; every signed-in user renders every comment on the SLICs
they look up; the admin renders *all* comments on `/admin/comments`. This is
attacker-chooses-victim, and one of the victims is the admin.

**Fix (all four layers — they cover different failure modes):**
1. **Sanitize at write time, on the server.** In `app/api/comment/route.js`, before
   `createComment`, run `content` through `sanitize-html` with an allowlist that matches
   what `@tiptap/starter-kit` can produce and nothing more:
   ```js
   import sanitizeHtml from 'sanitize-html';
   export const COMMENT_HTML_POLICY = {
     allowedTags: ['p','br','strong','b','em','i','s','u','code','pre','ul','ol','li',
                   'blockquote','h1','h2','h3','h4','h5','h6','hr'],
     allowedAttributes: {},          // StarterKit has no Link extension → no <a>, no href
     allowedSchemes: [],
     disallowedTagsMode: 'discard',
   };
   const clean = sanitizeHtml(content, COMMENT_HTML_POLICY);
   ```
   Put the policy in one module (`lib/commentHtml.js`) so the render side and the
   backfill script import the same object.
2. **Validate shape and size** in the same handler: `typeof content === 'string'`,
   `content.length <= 5000`, `typeof numSlic === 'string' && /^[A-Za-z0-9]{1,12}$/.test(numSlic)`,
   and reject a comment that is empty after sanitizing. Today a 50 MB string or an object
   is accepted (see #11).
3. **Sanitize at render time too** (defense in depth — protects against anything already
   in the collection and against a future write path that forgets step 1). Replace the
   four `parse(comment.content, …)` calls with one `<CommentHtml html={…} />` component
   that runs `isomorphic-dompurify` with the same allowlist before `parse()`. Note that
   `CommentBody.jsx` renders on the server, so the library must work in both runtimes —
   `isomorphic-dompurify` does; plain `dompurify` does not.
4. **Backfill.** `scripts/sanitizeComments.mjs --dry-run` that re-runs the policy over
   every existing `comments.content`, prints what would change, then writes. Keep a copy
   of the originals (`content_raw`) for one release in case the allowlist is too tight.

Then a CSP (#12) turns "we missed a tag" into "the browser refused to run it".

*Blast radius:* comments that used a tag outside the allowlist lose that formatting.
The dry-run tells you which ones before anything changes.

---

### [x] 3. Next.js and Auth.js are behind on published security fixes

**Files:** `package.json` (`next 15.3.6`, `next-auth ^5.0.0-beta.28`,
`@auth/mongodb-adapter ^3.9.1`, `@tiptap/* ^2.12`), `package-lock.json`

**Done 2026-10-07.** The new versions:

| Package | Was | Now |
|---|---|---|
| `next` (exact) | 15.3.6 | 15.5.27, the latest 15.5.x and past every fixed version in the table below |
| `eslint-config-next` | 15.1.8 | 15.5.27 |
| `next-auth` | 5.0.0-beta.28 | 5.0.0-beta.32 |
| `@auth/mongodb-adapter` | 3.9.1 | 3.11.3. It and next-auth both pin `@auth/core` 0.41.3, so there's one copy |

- **Tiptap:** it was removed outright with the plain-text Driver tips (UI-SUGGESTIONS #45),
  so its line needs no v3 upgrade.
- **Audit:** `npm audit fix` (non-breaking) cleaned the transitive build tools.
  `npm audit --omit=dev` went from 35 (4 critical) at the time of writing, to 9 (4 critical)
  after the Tiptap removal, to **2: 0 critical, 1 high, 1 moderate**.
  - Both are the `postcss@8.4.31` that `next` 15.x pins internally. It's used at build time
    on our own CSS, never on request input.
  - The only fix is Next 16. Revisit it with the Next 16 migration (Part 3,
    "Dependencies").
- **Lint:** `npm run lint` now runs clean. Two parts made it real, not just non-failing:
  - The eslint-config-next bump fixed the "Cannot serialize key 'parse'" crash.
  - `eslint.config.mjs` now names `**/*.{js,jsx,mjs}`. ESLint 9's flat config had been
    skipping every `.jsx` file, which is most of the app.

  The first real run found one real bug and a few small things, all fixed:
  - `app/admin/comments/page.jsx` rendered `RedirectMessage` without importing it, a
    latent ReferenceError.
  - Unescaped apostrophes.
  - A stale hook dependency in `CommentPrompt`.
  - An intentional `<a>` in `global-error.jsx`, now annotated.

  `next lint` itself is deprecated in 15.5. Move to the ESLint CLI with Next 16.
- **Edge warning:** the build warns that `jose`'s optional JWE compression touches
  `CompressionStream` in the Edge runtime (the middleware). It's a static-analysis note.
  Auth.js session tokens don't use compression, and the middleware runs fine (below).
- **Verified on a production build (`next start`), signed out:**
  - Public pages return 200.
  - `/home`, `/history` and `/admin` return 307 to sign-in.
  - Every API returns 401, and `/api/auth/session` returns `null`.
  - Both providers are listed, and `/api/auth/csrf` issues a token.
  - The advisory's `.rsc` URL returns 404.
- **Verified fail-closed (GHSA-8fpg-xm3f-6cx3):** I restarted with **no `AUTH_SECRET`**.
  Every API still returned 401 and protected pages still redirected. Only
  `/api/auth/session` reported the configuration error (500). On beta.28 the same
  misconfiguration made `auth()` truthy. Still do #4: centralizing the guard is right
  regardless.
- **Still to walk on a phone after deploy:** both sign-in paths (Google, and email and
  password), posting a tip, PDF upload, and the admin user toggles.

`npm audit --omit=dev` reports 35 vulnerable packages (4 critical, 4 high). The ones that
matter for *this* app, with the advisory and the first fixed version:

| Package | Advisory | Why it matters here | Fixed in |
|---|---|---|---|
| `next-auth` | GHSA-8fpg-xm3f-6cx3 (critical) — config errors make `auth()` return a truthy error object | Every route and page checks `if (!session)`. A missing env var in a preview deployment makes every check pass. See #4. | `5.0.0-beta.32` |
| `next` | GHSA-267c-6grr-h53f + GHSA-26hh-7cqf-hhc6 (high) — middleware bypass via `.rsc` / segment-prefetch URLs | `/bids` is protected by middleware alone; `app/admin/*` pages rely on the layout. See #7. | `15.5.16`, then `15.5.18` |
| `next` | GHSA-955p-x3mx-jcvp (moderate) — server-action IDs disclosed via client artifacts | The only thing between the internet and the unauthenticated actions in #5 is that their IDs aren't served. | `15.5.21` |
| `next` | GHSA-2xp9-vwfh-vxw4 (critical) — unauthenticated RCE in the image optimizer via AVIF | `next.config.mjs` enables remote image optimization for two Google hosts. On Vercel the optimizer is platform-side, which reduces (does not remove) exposure. | `15.5.24` |
| `next` | GHSA-mwv6-3258-q52c, GHSA-h25m-26qc-wcjf, GHSA-q4gf-8mx6-v5v3, GHSA-8h8q-6873-q5fj (high) — DoS via crafted RSC / server-action requests | Unauthenticated; one request can pin a function. | `15.3.7`–`15.5.16` |
| `next` | GHSA-ffhc-5mcf-pf4q (moderate) — XSS in App Router when using CSP nonces | Blocks doing #12 with nonces until upgraded. | `15.5.16` |
| `next` | GHSA-w37m-7fhw-fmv9 (moderate) — server-action source exposure | Combined with #5. | `15.3.7` |
| `@auth/core` | GHSA-x445-f3h2-j279 (moderate) — OAuth state/PKCE cookies not bound to provider | Google sign-in. | `0.41.3` |
| `@tiptap/core` | GHSA-cp6q-959q-f8rh (moderate) — `__proto__` in `mergeAttributes` becomes executable DOM attributes | The comment editor. Fix is a major (v3) upgrade. | `3.30.4` |

**Fix:** upgrade `next` to the latest 15.5.x (≥ 15.5.24 at time of writing) —
or plan the 16 migration — and `next-auth` to ≥ `5.0.0-beta.32` with the matching
`@auth/mongodb-adapter`. Then `npm audit --omit=dev` should show only the tiptap line;
schedule the tiptap v3 upgrade separately (it touches `CommentEditor.jsx`; test the
editor on iOS Safari — that's where drivers type). Also bump `eslint-config-next` to match
`next` so `npm run lint` stops failing on its own config. After upgrading, walk both
sign-in paths, comment posting, PDF upload and the admin user toggles on a phone.

Going forward this is a practice, not a task — see Part 3, "Dependencies".

---

### [ ] 4. `if (!session)` fails open on the installed Auth.js; centralize the guard

**Files:** every `app/api/**/route.js`, `app/admin/layout.jsx`, every page that calls
`auth()` (`app/home/page.jsx`, `app/history/page.jsx`, `app/profile/[id]/page.jsx`,
`app/covers/page.jsx`, `app/cover-bid-jobs/page.jsx`, …), `middleware.js`
(`const isLoggedIn = !!req.auth`)
**Depends on:** nothing — do this even before #3, it is the workaround the advisory gives.

GHSA-8fpg-xm3f-6cx3: on `next-auth ≤ 5.0.0-beta.31`, when Auth.js hits a configuration
error (missing `AUTH_SECRET`, missing Google client id — exactly what a preview
deployment without env vars looks like), `auth()` returns an object carrying the error
instead of `null`. `!!session` is then `true` for an anonymous request. Every guard in
this codebase is written that way, so a misconfigured deployment is a fully open one:
`GET /api/slics` would hand the dataset to anyone.

Separately, the same check is copy-pasted ~25 times with small variations
(`!session`, `!session || !session.user`, admin checks done via `session.user.role` in
some routes and via a fresh `getUserByEmail` in others). That is how `SUGGESTIONS.md`
#1–#5 and #22 happened: each new route re-implements the boundary from memory.

**Fix:**
1. Create `lib/authz.js`:
   ```js
   import { auth } from '@/auth';
   import { NextResponse } from 'next/server';

   export class HttpError extends Error {
     constructor(status, message) { super(message); this.status = status; }
   }

   // A session is only a session if it names a user. An Auth.js config error
   // object has no user (GHSA-8fpg-xm3f-6cx3).
   export async function getSessionUser() {
     const session = await auth();
     const user = session?.user;
     return user?.id ? user : null;
   }
   export async function requireUser() {
     const user = await getSessionUser();
     if (!user) throw new HttpError(401, 'Unauthorized');
     return user;
   }
   export async function requireAdmin() {
     const user = await requireUser();
     if (user.role !== 'admin') throw new HttpError(403, 'Forbidden: Admin access required');
     return user;
   }
   export async function requireMember() {
     const user = await requireUser();
     if (!user.bmcMember && user.role !== 'admin') throw new HttpError(403, 'Forbidden');
     return user;
   }
   // Wrap a route handler: guards throw HttpError, everything else is a 500.
   export function route(handler) {
     return async (request, ctx) => {
       try { return await handler(request, ctx); }
       catch (e) {
         if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
         console.error(`${request.method} ${new URL(request.url).pathname}:`, e);
         return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
       }
     };
   }
   ```
2. Replace every inline check with `const user = await requireAdmin();` /
   `requireUser()`. The `role` on the session is already fresh — `auth.js`'s `jwt`
   callback re-reads the user row on every request — so the routes that do their own
   `getUserByEmail` (`toggle-role`, `toggle-member`, `add-phone`, `admin/layout.jsx`) can
   drop it and, with it, the email-keyed identity lookup (#19).
3. In `middleware.js` use `!!req.auth?.user?.id`.
4. Add the rule to Part 3: **no route or page calls `auth()` directly.**

*Blast radius:* none visible. Every route keeps its status codes and `{ error }` bodies.

---

### [ ] 5. `lib/db/comments.js` is a set of unauthenticated public endpoints

**Files:** `lib/db/comments.js:1` (`'use server'`)

A file-level `'use server'` directive turns **every export** of that module into a
Server Action — a `POST` endpoint Next.js will invoke for anyone who sends the action's
id in a `Next-Action` header. The production build confirms it: the manifest at
`.next/server/server-reference-manifest.json` bundles `lib/db/comments.js` into the
actions loader for `app/home/page` — one action id per export, six in all. None of those
functions check a session:

- `createComment({ userId, numSlic, content })` — post a comment **as any user id**, no
  rate limit, no sanitization. This is `SUGGESTIONS.md` #5 back from the dead through a
  different door.
- `deleteComment(commentId)` — arguments to actions are deserialized objects, so
  `deleteComment({ $ne: null })` becomes `deleteOne({ _id: { $ne: null } })`: delete an
  arbitrary comment, no ownership check.
- `getAllComments()`, `getCommentsByUserId(id)`, `getCommentsBySlic(n)`,
  `getCommentVoters(id)` — read everything, including the members-only voter lists.

What stands between the internet and these today is that the action ids are not in any
client bundle (no client component imports the module). That is obscurity, not
authorization: the ids are printed in the server build, GHSA-955p-x3mx-jcvp (#3) is
specifically about them leaking, and the Next.js security guidance is explicit that every
Server Action must authorize itself because it is a public endpoint.

**Fix:** delete line 1. The module is imported only by route handlers and server
components, none of which need it to be an action; `next build` will show whether
anything relied on it (nothing should). Then grep for `'use server'` — the two remaining
uses (`Header.jsx`, `SignIn.jsx`) are inline actions calling `signIn`/`signOut`, which is
what the directive is for. Add the rule to Part 3: **`'use server'` never goes on a data-
access module.**

---

### [ ] 6. Password hashes and emails are sent to the browser

**Files:**
- `app/api/users/[userId]/add-phone/route.js:152` (logs the full updated user document)
  and `:154` (returns it) — the *user's own* bcrypt hash goes to their browser and into
  Vercel's logs on every profile edit.
- `app/api/users/[userId]/toggle-role/route.js:57,83` and
  `toggle-member/route.js:57,83` — return the *target* user's full document (hash,
  email, phone) to the admin's browser.
- `lib/serializers.js` `serializeUser` / `serializeUsers` — `{ ...userData }` spreads
  the whole document, then it is passed to `'use client'` components:
  `app/admin/users/page.jsx:18` → `UserList` (every user's hash, in the RSC payload of
  the admin page), `app/admin/users/[id]/page.jsx:69` → `UserComments`,
  `app/admin/comments/page.jsx:61` → `CommentsSection`, `app/profile/[id]/page.jsx:64`
  → `ProfileData`, `app/covers/page.jsx:56` → `CoversDate`.
- `lib/db/users.js` `getUsers()` / `getUserById()` — return full documents with no
  projection, so every caller has to remember to strip.

A hash reaching the user who owns it is not a break-in, but a hash reaching the admin's
browser for every account is: the admin's laptop, browser cache, a screenshot, a Vercel
log drain, or an XSS on the admin page (#2) each become a route to offline cracking of
every driver's password — and drivers reuse passwords. `getPublicUserById` already does
this right (projects to `{ name, image }`); it is the exception, not the rule.

**Fix:**
1. In `lib/db/users.js`, make projection the default. Keep a single internal
   `findUserWithSecrets(_id)` for `authorize()` and nothing else; everything else reads
   through `USER_PUBLIC_PROJECTION = { name: 1, image: 1 }`,
   `USER_SELF_PROJECTION = { name: 1, firstName: 1, lastName: 1, email: 1, image: 1,
   phone: 1, role: 1, bmcMember: 1, created_at: 1 }` and
   `USER_ADMIN_PROJECTION = USER_SELF_PROJECTION + { driverId: 1, emailVerified: 1 }`.
   `password` is never in a projection.
2. Replace `serializeUser(s)` with explicit allowlist serializers (`toSelfUser`,
   `toAdminUser`) that pick fields rather than spreading. A spread serializer will leak
   again the day someone adds a field.
3. The three mutation routes return the projected document (or just
   `{ _id, role }` / `{ _id, bmcMember }` / `{ _id, name, phone }` — the client only
   reads those) and log ids, not documents (#22).
4. Grep for `password` in the `.next/server/app/admin/users/page.js` output after the
   change; it should not appear.

---

### 🟠 Tier 1 — High

Exploitable by a signed-in user, or a wall that is thinner than it looks.

---

### [ ] 7. Authorization lives in the wrong layer for `app/admin/*` and `/bids`

**Files:** `app/admin/layout.jsx` (the only admin check for `admin/page.jsx`,
`admin/slics`, `admin/new`, `admin/edit/[slic]`, `admin/users`, `admin/users/[id]`,
`admin/drivers`, `admin/cover/*`), `app/admin/comments/page.jsx` (has its own check but
references `RedirectMessage` without importing it — the non-admin branches would throw),
`app/bids/page.jsx` (no check at all; middleware only), `middleware.js:69`

Two documented Next.js facts make a layout the wrong place for an auth check. Layouts do
not re-render on client-side navigation, so the check does not run again as an admin
moves between admin pages (the Next.js authentication guide says exactly this and
recommends checking "close to your data source"). And the RSC protocol lets a client ask
for a page segment on its own — which is what the middleware-bypass advisories on the
installed version exploit (#3). Every admin page fetches its data unconditionally
(`getUsers()`, `getAllDrivers()`, `getCovers()`, …) and the page itself never asks who is
calling.

`/bids` is worse: `app/bids/page.jsx` reads `bid-jobs` and renders it with **no**
`auth()` call, and the middleware matcher on line 69 explicitly excludes every path that
contains a `.` — the shape the `.rsc` bypass uses. (The same matcher sends unauthenticated
users to `/signin?callbackUrl=…`, a route that does not exist — `app/signin/` is not in
the tree — so they land on the 404 page and `callbackUrl` is dropped. Not a security bug,
but it is the auth flow, so fix it while here: point the redirect at `/`.)

**Fix:**
1. Every page under `app/admin/` starts with `await requireAdmin()` (from #4) — or,
   better, the page is a thin shell and the admin data functions themselves call it
   (`getUsers()` → `await requireAdmin()` on line one). Data-layer checks are the ones
   that cannot be skipped by a clever request. Keep the layout check as well; it gives
   the nicer redirect.
2. `app/bids/page.jsx`: add `await requireUser()`; decide who should actually see bid
   jobs (the sibling `/cover-bid-jobs` requires admin **and** member, which reads like a
   typo for "admin **or** member" — settle it).
3. Fix `app/admin/comments/page.jsx`'s missing import (or drop its redundant check once
   step 1 is in).
4. Middleware matcher: keep it, but stop treating it as a boundary. Remove `/dashboard`
   and `/protected` (no such routes); change the sign-in redirect to a route that exists.

---

### [ ] 8. Open registration, no email verification, and the account-squatting it enables

**Files:** `app/api/auth/register/route.js`, `auth.js` (Google provider, default
`allowDangerousEmailAccountLinking: false`), `app/components/signIn/Membership.jsx`
("Use SLICs now"), `app/api/webhooks/buymeacoffee/route.js` (matches on email)

Three things combine here:

- **Anyone can register and immediately read everything.** The README describes a
  building of ~270 drivers; the app accepts any email on Earth. Whether that is the
  intended access model is a product decision, but it should be a *decision*, written
  down, not a default. As it stands, the sign-in gate protects the dataset from nobody
  who wants it — and every "signed-in only" finding in this document should be read with
  that in mind.
- **Email is never verified** (`emailVerified: null`, no verification flow). Whoever
  types an address first owns it.
- **Registering with someone else's Gmail locks them out of Google sign-in.** Auth.js
  refuses to link a Google login to an existing user with the same email that has no
  linked `accounts` row (`OAuthAccountNotLinked`). So: attacker registers
  `driver@gmail.com` with a password → the real driver's Google button now fails with
  an opaque error, forever, until the admin intervenes. The squatted account also
  *receives that person's Buy-Me-a-Coffee membership* when the webhook arrives, and it
  shows the victim's email to the admin on `/admin/users`, which is exactly the
  detail an admin would use to decide who gets a roster link or a role.

**Fix (pick the access model, then close the squatting hole regardless):**
1. **Access model — choose one and write it in the README:**
   (a) *Approval queue:* new accounts get `status: 'pending'`; `requireUser()` treats
   pending as 401 for data routes; admin approves from `/admin/users`. The commented-out
   `RequestAccess.jsx` was this idea. (b) *Invite code / domain allowlist:* a shared code
   the admin rotates, or an allowlist of email domains. (c) *Keep it open* — then say so
   in the privacy policy ("anyone can create an account") and accept that the dataset is
   effectively public.
2. **Verify email for password accounts** before the account is usable: a signed,
   time-limited token emailed on registration (Resend/Postmark free tiers are enough;
   Auth.js's `verification_tokens` collection already exists for this). Until verified,
   the user can sign in but `requireUser()` returns 403 with "check your email".
3. **Close the squatting hole:** when a Google sign-in hits an *unverified*
   password account with the same email, either link it (safe *only* because Google has
   verified the address — do this in the `signIn` callback, not via
   `allowDangerousEmailAccountLinking`) or delete the unverified row. Never let an
   unverified password account block a verified provider.
4. **BMC webhook:** only grant membership to a user whose email is verified (Google
   users are; password users after step 2).
5. Registration hardening that is cheap regardless: reject names that are empty after
   `trim()` (today `firstName: ' '` passes the check and then `first[0].toUpperCase()`
   throws — a 500), cap name length (≤ 60), cap password length (≤ 128 — bcrypt
   silently truncates at 72 bytes), `typeof` every field before calling `.trim()` on it,
   and HTML-escape the two initials before interpolating them into the avatar SVG
   (`initialsAvatar`).

---

### [ ] 9. Password sign-in has no brute-force protection, no lockout, no reset, no MFA

**Files:** `auth.js` (`authorize`), `app/api/auth/register/route.js`, `lib/rateLimit.js`

- `authorize()` runs one bcrypt compare per attempt with **no rate limit**. The limiter
  exists (`checkRateLimit`) and is used for registration and comments, but not for the
  one endpoint where it matters most. Credential stuffing against `/api/auth/callback/credentials`
  is unthrottled; each attempt also costs the server ~250 ms of CPU at cost 12.
- `if (!user || !user.password) return null` returns in microseconds for an unknown
  email and after a bcrypt round for a known one — a timing oracle for "does this email
  have an account". The register route's `409` confirms it outright.
- **There is no password reset or change flow.** A driver who forgets their password is
  locked out; a driver whose password leaked elsewhere cannot rotate it; the maintainer
  cannot force a rotation.
- Admin accounts are ordinary accounts: 8-character minimum, no MFA. One phished
  password is the whole dataset and every account.

**Fix:**
1. In `authorize()`: `checkRateLimit({ key: \`login:${emailLower}\`, limit: 10,
   windowMs: 15 * 60_000 })` **and** a per-IP key with a higher ceiling
   (`getClientIp` needs the request — Auth.js passes it as the second argument to
   `authorize`). Return `null` on limit. Always run `bcrypt.compare` against a fixed
   dummy hash when the user is missing so both paths take the same time.
2. Add a reset flow once email exists (#8 step 2): `POST /api/auth/forgot` (always 200,
   rate-limited by email and IP), token in `verification_tokens` with a 30-minute expiry,
   `POST /api/auth/reset` that hashes the new password, deletes the token and bumps a
   `passwordChangedAt` — and have the `jwt` callback reject tokens issued before it, so
   a reset signs out every other device.
3. Admins: require Google sign-in (with 2-step verification on the Google account) for
   any account with `role: 'admin'` — enforce it in `authorize()` by refusing password
   login for admins — or add TOTP (`otpauth` is ~2 KB) as a second factor for the admin
   role only. Either is a one-evening change; the first is simpler.
4. Register: check the password against the HIBP range API (k-anonymity, no key) and
   reject the top-N breached passwords. Optional, cheap, prevents the most common
   account takeover.

---

### [ ] 10. Mass assignment in every PATCH route

**Files:** `app/api/cover/[position]/route.js:24` (`$set: updates`),
`app/api/drivers/[id]/route.js:23` (`$set: updates`, only `_id` removed),
`lib/db/coverBidJobs.js:190` (`...updates`), `lib/db/slics.js:116-131`
(`updateSlic` — strips `_id`, guards `numSlic`, spreads the rest)

Each of these takes the request body and writes every key of it to the document. All
four are admin-only, so the attacker is "an admin, or someone with an admin's session"
(#2, #9) — but the damage is not limited to the admin's own data:

- `updateSlic` accepts `pdfUrl`. `app/components/home/PdfLink.jsx` renders it straight
  into `href`. A `pdfUrl` of `javascript:…` or an attacker-hosted PDF becomes a link
  every driver taps — the audit-trail-preserving upload route (`slic/[id]/pdf`) is
  bypassed entirely. Same for `createdBy`, `created_at`, `updatedBy`: the audit stamps
  are writable through the same call that is supposed to record them.
- `drivers/[id]` and `cover/[position]` accept any key with any type, including
  dotted paths (`"a.b"`) and nested documents, so the shape of the collection is
  whatever the last request said it was (#16).
- `cover/[position]` also never checks `Number.isNaN(posInt)`.

**Fix:** allowlist at the boundary, validate types, and never let the body name an
audit field.
```js
// lib/schemas/slic.js — zod, ~1 KB, works in route handlers
export const SlicUpdate = z.object({
  type: z.enum(['center', 'customer']).optional(),
  alphaSlic: z.string().trim().regex(/^[A-Z0-9]{2,8}$/i).optional(),
  name: z.string().trim().max(120).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  address: z.object({ street: z.string().max(200), city: z.string().max(100),
                      state: z.string().max(40), zip: z.string().max(12) }).optional(),
  directions: z.string().max(2000).nullable().optional(),
}).strict();   // unknown keys → 400, so pdfUrl/createdBy/numSlic can't arrive here
```
`pdfUrl` is set only by `slic/[id]/pdf`, which validates the URL it got back from
`put()` (`https:` and the Blob store host). Do the same for `DriverUpdate`,
`CoverUpdate`, `CoverBidJobUpdate`. `updateSlic` keeps its `numSlic` guard as a second
line.

---

### [ ] 11. Input validation at the API boundary is ad hoc

**Files:** `app/api/comment/route.js` (POST: `numSlic`/`content` any type, any size),
`app/api/user/track-view/route.js` (`numSlic` any type, no rate limit, unbounded
inserts), `app/api/comments/[commentId]/vote/route.js` (no `ObjectId.isValid`, no
existence check, no rate limit), `app/api/users/[userId]/add-phone/route.js` (`phone`
any string, any length), `app/api/drivers/route.js` (`name`/`seniorityDate` not
type-checked before `.trim()`), `app/api/drivers/[id]/route.js` (no `ObjectId.isValid`
→ 500 instead of 400), `app/api/coverBidJobs/extract/route.js` (`images[].data`
unbounded base64 → Gemini, cost is the admin's), `app/api/comments/route.js` (error
responses with status 200)

None of these are injection bugs — the Mongo driver is used with object filters, ids go
through `ObjectId`, and `request.json()` bodies are only ever *stored*, not spliced into
queries. But "anything goes in" is how storage fills (`slicViews` has no TTL and
`track-view` accepts a 1 MB `numSlic` at any rate), how a collection ends up with three
types in one field (`setNumSlicsToString` exists because it already happened), and how a
`.trim()` on a number becomes a 500 with a stack trace in the logs.

**Fix:** one `lib/schemas/*.js` per collection (zod), parsed at the top of every handler
through a tiny helper:
```js
export async function parseBody(request, schema) {
  let body; try { body = await request.json(); } catch { throw new HttpError(400, 'Invalid JSON'); }
  const r = schema.safeParse(body);
  if (!r.success) throw new HttpError(400, r.error.issues[0]?.message ?? 'Invalid request');
  return r.data;
}
```
Specific rules to encode: `numSlic` `/^[A-Za-z0-9]{1,12}$/` and must exist in `slics`
for `track-view` (one `findOne` — or accept the write but rate-limit it: 60/hour/user);
comment `content` ≤ 5,000 chars after sanitizing (#2); `phone` matches
`/^[\d\s()+.-]{7,20}$/` or empty; every `[id]` param through `ObjectId.isValid` before
`new ObjectId` (400, not 500); `extract` caps total `images[].data` at 4 MB and 6 files;
`comments/route.js` returns 400/500 statuses with its `{ error }` bodies. Add a TTL
index on `slicViews.viewedAt` (#21) so the collection is bounded even if a limit slips.

---

### [ ] 12. No security headers, no CSP

**Files:** `next.config.mjs` (no `headers()`), `app/layout.jsx:48` (inline
`captureInstallPrompt`), `<InitColorSchemeScript>` (inline)
**Depends on:** #3 (GHSA-ffhc-5mcf-pf4q makes nonces unsafe on the installed version).

The app sets no `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy` or `Permissions-Policy`. Vercel adds HSTS on its own; nothing else.
Without a CSP, #2 is a full compromise; with one, the same comment is a broken layout.
Without `frame-ancestors`, any site can iframe `/home` and clickjack the delete/vote
buttons of a signed-in driver.

**Fix:** start with the headers that cannot break anything, ship, then tighten `script-src`.
```js
// next.config.mjs
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: [
      "default-src 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://accounts.google.com",
      "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.public.blob.vercel-storage.com",
      "font-src 'self' https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline'",          // Emotion/MUI inject styles at runtime
      "connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com",
      "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",  // step 1; see below
      "frame-src 'none'",
      "upgrade-insecure-requests",
    ].join('; ') },
];
export default { poweredByHeader: false, images: { … },
  async headers() { return [{ source: '/(.*)', headers: securityHeaders }]; } };
```
`frame-src 'none'` + `object-src 'none'` + `base-uri 'self'` + `form-action` already
neutralize most of #2's vectors even with `'unsafe-inline'` scripts. Step 2, after #3:
move the two inline scripts to nonces (a `middleware.js` nonce + `headers()` per request,
per the Next.js CSP guide) and drop `'unsafe-inline'` from `script-src`. Test on iOS
Safari in standalone (installed) mode — the PWA path is the one nobody checks.

---

### [ ] 13. Directions PDFs are reachable without signing in

**Files:** `lib/blob.js:19` (`access: 'public'`), `utils/variables.js`
(`LEGACY_PDF_BASE_URL`, `legacyPdfUrl`), `utils/pdfs.js` (a list of 65 legacy file
names), `app/components/home/PdfLink.jsx`, `scripts/migratePdfsToBlob.mjs`

The PDFs are the same "customer center directions" the sign-in gate exists to protect,
and both stores serve them to anyone with the URL:

- **Legacy Supabase bucket:** public, and the file name is `<alphaSlic>.pdf` — predictable
  from a SLIC code. `utils/pdfs.js` is literally the index. Anyone can fetch all 65 today
  with no account.
- **Vercel Blob:** public with a random suffix, so the URL is unguessable — but it is
  handed to every signed-in browser and never expires. A URL pasted into a group chat is
  public forever, and there is no way to revoke it short of re-uploading.

**Fix:**
1. Finish the migration (`npm run pdfs:migrate`), verify every slic has `pdfUrl`, delete
   the Supabase bucket, remove `LEGACY_PDF_BASE_URL`/`legacyPdfUrl`/`utils/pdfs.js` and
   the `slic.pdf` fallback in `PdfLink.jsx` (the CLAUDE.md note about the fallback is the
   reminder for this step). Also drop the hard-coded Supabase project ref from the code.
2. Serve PDFs through the app: `GET /api/slic/[id]/pdf` → `requireUser()` → fetch the
   blob server-side → stream it with `Content-Disposition: inline`. `PdfLink` links to
   that route; the blob URL never reaches a browser. Keep `addRandomSuffix` (it is what
   makes the blob unguessable) and, if the Blob store offers private access on your plan,
   switch to it so even a leaked URL fails.
3. Validate uploads by content, not just extension: check the first bytes are `%PDF-`.

---

### [ ] 14. Buy Me a Coffee webhook: timing-unsafe compare, no replay protection, email-keyed

**Files:** `app/api/webhooks/buymeacoffee/route.js:34` (`digest !== signature`)

- `!==` on two hex strings is a byte-by-byte early-exit compare. Over a network this is a
  weak oracle, but `crypto.timingSafeEqual` costs one line and the comparison is on the
  path that grants a paid tier.
- The handler has no idempotency or freshness check. A captured `membership.started`
  request can be replayed after the member cancels and re-grants membership; a duplicate
  delivery flips nothing today but will the moment the handler does more than `$set`.
- `updateOne({ email: supporterEmail })` — exact-case match against whatever BMC sends,
  granted to whichever account holds that email (#8), no log of *which* user was changed.

**Fix:**
```js
const expected = crypto.createHmac('sha256', SECRET).update(rawBody).digest();
const given = Buffer.from(signature ?? '', 'hex');
if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) → 403
```
Normalize the email (`trim().toLowerCase()`), require `emailVerified` (#8), store
processed event ids (`bmc_events` with a TTL of 30 days; 200 + no-op on repeat), and
write an `admin_audit` entry (#17) with `{ userId, field: 'bmcMember', from, to,
source: 'bmc-webhook', eventType }`. Rate-limit the route by IP (it is pre-auth).
Confirm the header name against BMC's current docs — the code comments say it was a
guess.

---

### 🟡 Tier 2 — Data integrity

None of these lets an attacker in. All of them decide whether the data is still correct
after a bad day.

---

### [ ] 15. No unique indexes → check-then-insert races

**Files:** `scripts/createIndexes.js` (all five indexes are non-unique),
`app/api/auth/register/route.js` (`findOne` then `insertOne`), `lib/db/slics.js`
`createSlic` (same), `app/api/drivers/route.js` (same), `auth.js` (`MongoDBAdapter` —
the adapter creates **no** indexes itself)

Every uniqueness rule in the app is enforced by "look, then write". Two concurrent
registrations for the same email — a double-tap on a slow connection is enough — produce
two `users` rows with one email, and from then on every email-keyed lookup
(`admin/layout.jsx`, `toggle-role`, `app/page.jsx`, the BMC webhook) picks whichever row
Mongo returns first. Same for `slics.numSlic` (which comments, history and views are keyed
by) and `drivers.employeeId`.

**Fix:** add to `createIndexes.js` and run it:
```js
{ collection: 'users',    spec: { email: 1 },            options: { unique: true } },
{ collection: 'accounts', spec: { provider: 1, providerAccountId: 1 }, options: { unique: true } },
{ collection: 'slics',    spec: { numSlic: 1 },          options: { unique: true } },
{ collection: 'slics',    spec: { alphaSlic: 1 },        options: { unique: true } },
{ collection: 'drivers',  spec: { employeeId: 1 },       options: { unique: true } },
{ collection: 'verification_tokens', spec: { identifier: 1, token: 1 }, options: { unique: true } },
```
Run each with `--dry-run` first — a `unique` build fails if duplicates already exist,
which is itself the finding. Then catch `E11000` in the three create paths and return the
existing 409 so the user-facing behaviour is unchanged. (`{ email: 1 }` non-unique must
be dropped before the unique one is created; do it in the script.)

---

### [ ] 16. No schema validation on the collections

**Files:** MongoDB (collection options), `utils/variables.js` (the `SLIC_*_EXAMPLE`
shapes are documentation only)

The shape of every document is whatever the last writer sent (#10, #11). `numSlic` has
been both a number and a string; `created_at` is an ISO string in new code and `MM/DD/YY`
in old rows (CLAUDE.md warns about this); `comments.userId` is a string while
`slicViews.userId` is an `ObjectId`. Application-level validation (#11) protects new
writes; a `$jsonSchema` validator on the collection protects against the writer you
forgot — a script, the Atlas UI, the next migration.

**Fix:** `scripts/applyValidators.js` with `collMod` + `$jsonSchema` for `slics`,
`comments`, `users`, `drivers`, `slicViews`, `slic_history`, run with
`validationLevel: 'moderate'` (existing invalid docs are tolerated, new/updated ones
must conform) and `validationAction: 'error'`. Start from the example shapes in
`utils/variables.js`. Pair it with a one-off `scripts/normalizeDates.mjs --dry-run` that
converts the legacy `MM/DD/YY` strings to ISO so the "don't assume" note in CLAUDE.md
can finally be deleted.

---

### [ ] 17. The audit trail has holes and is best-effort

**Files:** `lib/db/slics.js` `deleteSlic` (no history entry), `lib/db/slicHistory.js`
`addSlicHistoryEntry` (catches and swallows), `app/api/users/[userId]/toggle-role/route.js`
and `toggle-member` (no record of who changed whom), `app/api/comment/route.js` DELETE and
`comments/[commentId]/route.js` (admin deletions of other people's comments leave nothing),
`app/api/webhooks/buymeacoffee/route.js` (membership flips unrecorded)

`createSlic` and `updateSlic` write history — and CLAUDE.md rightly says not to bypass
them. But: deleting a slic writes nothing, so the trail for a SLIC that vanished is the
absence of a trail. History writes are deliberately non-blocking, which means a Mongo
hiccup produces a silent gap and nothing tells you. And the two most consequential admin
actions — promoting a user to admin and toggling paid membership — have no record at
all, so a compromised admin session (#9) can promote an attacker and there is no
"who did this, when" to find afterwards.

**Fix:**
1. `deleteSlic` writes `{ action: 'deleted', changes: null, snapshot: existingSlic }`
   before `deleteOne` — or better, soft-delete (#18) and the update path records it.
2. Wrap `updateOne` + history in a transaction (`client.startSession()` /
   `withTransaction`; Atlas replica sets support it). If the history insert fails the
   edit rolls back, and the route returns 500 — a loud failure over a quiet gap.
3. New collection `admin_audit`: `{ actorId, actorEmail, action, targetType, targetId,
   from, to, source, at }`. Written by `toggle-role`, `toggle-member`, the BMC webhook,
   admin comment deletion, driver create/edit/delete, and account deletion. Read-only
   list at `/admin/audit`. Twenty lines; it is the difference between "something
   happened" and "this happened".

---

### [ ] 18. Hard deletes orphan everything keyed by `numSlic`

**Files:** `lib/db/slics.js` `deleteSlic`, `lib/db/users.js` `deleteUserAccount`

CLAUDE.md notes `numSlic` is immutable *because* comments, `slic_history` and `slicViews`
are keyed by it. Deleting a slic leaves all three pointing at nothing — and if an admin
later re-creates that `numSlic` (the uniqueness check only blocks *live* duplicates),
the old comments reappear under the new location. The `/history` page already guards
this with "if it's missing show the raw code", which is the symptom.

`deleteUserAccount` is the model of how to do it: dependent data first, a documented list
of what is intentionally left (the audit stamps), the user row last.

**Fix:** soft-delete slics (`deletedAt`, `deletedBy`); `getAllSlics` and
`getSlicByNumSlic` filter `deletedAt: null`; the admin table gets a "show deleted" toggle
and a restore action (which writes history). The uniqueness check stays on the live set.
Purge for real only from a script, after a retention period, and cascade
`comments`/`slicViews`/`slic_history` when you do.

---

### [ ] 19. Self-demotion, last-admin, and email-keyed identity

**Files:** `app/api/users/[userId]/toggle-role/route.js` (no server-side guard against
changing your own role — only `UserCard.jsx` hides the button), `app/admin/layout.jsx`,
`toggle-role`, `toggle-member`, `add-phone`, `app/page.jsx` (all look the user up by
`session.user.email` instead of `session.user.id`)

An admin can `PATCH /api/users/<own id>/toggle-role` with curl and lock themselves out;
if they were the only admin, nobody can fix it without the Atlas console. And every
place that resolves "who is calling" by email instead of `_id` is one duplicate-email row
(#15) away from resolving to the wrong person.

**Fix:** in `toggle-role`: `if (userId === user.id) → 403 'You cannot change your own role'`,
and before demoting: `countDocuments({ role: 'admin' }) > 1` or 409 'Cannot remove the
last admin'. Everywhere else: look up by `new ObjectId(user.id)`; the email lookups
disappear with #4.

---

### [ ] 20. Confirm the database and hosting configuration (cannot be verified from the code)

**Files:** none — Atlas, Vercel and Google Cloud console.
**Evidence in the repo:** local `.env` points `MONGODB_URI` at the `slics.…mongodb.net`
cluster; `.env.example` says the connection string names no database ("the driver's
implicit default (`test`)"); `lib/db/client.js` enables `serverApi.strict` (good).

Confirm, and note the answer in this file:

- [ ] **Least privilege.** The Atlas user in `MONGODB_URI` has `readWrite` on the one
  database and nothing else — not `atlasAdmin`, not `readWriteAnyDatabase`. Scripts that
  create indexes/validators can use a second user with `dbAdmin`, used only from a
  laptop.
- [ ] **Network access.** Vercel's egress IPs are dynamic, so the Atlas IP allowlist is
  probably `0.0.0.0/0`. That is acceptable only with a long random password and TLS
  (Atlas default). Better: the Vercel ↔ Atlas integration or a private endpoint.
- [ ] **Backups.** Atlas continuous (point-in-time) backup is on for the cluster tier in
  use, and you have **restored one to a scratch cluster** at least once. An untested
  backup is a hope.
- [ ] **Dev/prod separation.** If the local `.env` cluster *is* production, then
  `npm run dev`, every script, and every "let me just check" query run against live
  data. Create a `slics-dev` database (same cluster is fine, separate user) and point
  local `.env` at it; seed it from a sanitized export. Set Vercel **Preview** env vars to
  that database too, so preview deployments never touch production.
- [ ] **Vercel Deployment Protection** on Preview deployments (Vercel Authentication or
  password), so `*-git-branch.vercel.app` URLs are not a second, unmonitored front door
  to the same data.
- [ ] Vercel env vars marked **Sensitive** (write-only in the dashboard); a **separate
  `AUTH_SECRET`** and Google OAuth client per environment (rotating prod then logs out
  prod only).
- [ ] Google Cloud: the OAuth client's authorized redirect URIs are exactly the
  production and preview origins, nothing wildcarded; the consent screen is
  "In production", not "Testing" (Testing tokens expire and users get re-prompted).
- [ ] The Gemini key is on a **paid** API tier or you have confirmed the data-use terms
  for the tier you use — bid sheets contain driver names and the privacy policy promises
  they go to Gemini "to read the job rows", not to train a model.
- [ ] Vercel Firewall: turn on rate limiting for `/api/auth/*` and `/api/auth/register`
  (available on Pro) as a platform-level backstop to the in-app limiter, which
  fails open by design.

---

### [ ] 21. Retention: keep what the policy says, delete the rest automatically

**Files:** `app/privacy/page.jsx` ("Lookup history is kept while your account exists.
The History page shows the most recent six months."), `app/api/user/track-view/route.js`,
`app/admin/users/[id]/page.jsx` (`getSlicViewsByUserId` — unbounded), `lib/rateLimit.js`
(TTL — the one collection that already self-cleans), `lib/db/users.js`
`deleteUserAccount` (leaves `{ id, name, email }` stamps in `slic_history`,
`slics.createdBy/updatedBy`, `cover-bid-jobs`)

`slicViews` grows by one row per lookup forever (~130/day per the README, ~50k/year) and
the only consumer shows six months. The privacy policy could promise less and the app
could keep less, with one index. The account-deletion path is thorough and documented,
but the policy says "everything tied to it" and the audit stamps keep the email.

**Fix:**
1. TTL index: `slicViews { viewedAt: 1 } { expireAfterSeconds: 365 * 86400 }` (or 180
   days to match the UI). Update the policy line to "kept for 12 months".
2. `deleteUserAccount`: anonymize stamps rather than leave them —
   `updateMany({ 'user.id': userId }, { $set: { 'user.name': 'Deleted user', 'user.email': null } })`
   on `slic_history`, and the same on `slics.createdBy/updatedBy` and
   `cover-bid-jobs.createdBy/updatedBy`. The `id` stays (it is not PII on its own) so the
   trail still links.
3. Write the retention table into the privacy page from one source of truth
   (`utils/retention.js` exporting the day counts) so policy and index cannot drift.
4. Consider whether the roster needs employee IDs at all. Every field you do not store
   is a field that cannot leak (again).

---

### [ ] 22. Logging hygiene: PII and secrets in Vercel logs

**Files:** `app/history/page.jsx:52` (`console.log(session)` — name, email, id, role, on
every page view), `app/api/users/[userId]/add-phone/route.js:152` (whole user document
including the bcrypt hash), `app/api/users/[userId]/route.js` (`Deleted account …:` with
counts — fine), `app/api/webhooks/buymeacoffee/route.js` (supporter email),
`app/api/auth/register/route.js` (bare `catch {}` — the opposite problem: a failing
registration logs nothing)

Vercel keeps logs; log drains copy them to a third party; anyone with project access
reads them. Logs should let you debug without becoming a second database.

**Fix:** delete the `console.log(session)`; log ids, not documents (`Updated user
${userId}: fields=${Object.keys(updateDoc.$set)}`); never log `password`, `email`,
`phone`, tokens or request bodies. In `register`, log the error class (not the body).
Add the rule to Part 3. If you want structure, a 10-line `lib/log.js` that redacts a
fixed key list before `console.error` is enough — no dependency needed.

---

### [ ] 23. Internal error text in responses

**Files:** `app/api/newSlic/route.js:37`, `app/api/slic/[id]/route.js:64,68,100`,
`app/api/slic/[id]/pdf/route.js:98,131`, `app/api/cover/[position]/route.js:32`,
`app/api/drivers/[id]/route.js:58`, `app/api/coverBidJob/[id]/route.js:26,29,52,55`,
`app/api/coverBidJobs/route.js:43,77,116`, `app/api/coverBidJobs/weeks/route.js:25`,
`app/api/coverBidJobs/extract/route.js:139`

CLAUDE.md's rule ("don't include the raw caught error in the body") is followed in about
half the routes. The other half return `error.message` — which for a Mongo error
includes collection names and field paths, for a Gemini error can include quota and
model details, and for a `newSlic` failure includes the *other* slic's codes. All of
these are admin-only routes, so the audience is small; the fix is still mechanical.

**Fix:** with `route()` from #4 the catch-all becomes 'Internal server error'
automatically. Keep the deliberate messages (`not found`, `numSlic cannot be changed`,
validation text) by throwing `HttpError(404|400, msg)` from the data layer for those
specific cases instead of `Error` and string-matching on `.message`.

---

### [ ] 24. Rate-limit coverage

**Files:** `lib/rateLimit.js` (the limiter — sound, Mongo-backed, TTL-cleaned,
documented fail-open), `app/api/auth/register` (IP, 10/h ✓), `app/api/comment` POST
(user, 10/10min ✓). Not limited: credentials sign-in (#9), `comments/[id]/vote`,
`user/track-view`, `users/[id]/add-phone`, `users/[userId]` GET (id → name/avatar; ids
are ObjectIds — time-ordered, not random), `webhooks/buymeacoffee`, `slic/[id]/pdf`
POST and `coverBidJobs/extract` (admin; the cost is yours), `comments` GET.

**Fix:** a table of keys and ceilings in `lib/rateLimit.js` so every route imports a
named policy instead of inventing numbers:
`LOGIN_EMAIL 10/15min`, `LOGIN_IP 100/15min`, `VOTE 60/10min/user`, `TRACK_VIEW
120/h/user`, `PROFILE_EDIT 20/h/user`, `USER_LOOKUP 600/h/user`, `WEBHOOK 60/h/ip`,
`EXTRACT 20/h/user`. `getClientIp` trusts `x-forwarded-for`, which Vercel overwrites
(safe there) but a self-hosted or local run does not — note it in the function.

---

### [ ] 25. Dependency hygiene

**Files:** `package.json`

- `"crypto": "^1.0.1"` is the deprecated **npm** package of that name (an empty
  placeholder), not Node's built-in. `import crypto from 'crypto'` resolves to the
  built-in regardless, but a hijacked publish of that package would be installed on every
  build. Remove it.
- `lib/stripe.js` imports `stripe`, which is not in `package.json`, and reads
  `STRIPE_SECRET_KEY`, which is not in `.env.example`. Nothing imports the file. Delete it
  (`STRUCTURE.md` lists it as dead too).
- `eslint-config-next 15.1.8` vs `next 15.3.6` — mismatched, and `npm run lint`
  currently fails on its own config. Align them so lint can gate PRs again.
- No `engines` field, no CI. `npm ci` (not `install`) is what Vercel runs; keep the
  lockfile committed (it is).

**Fix:** `npm uninstall crypto`; `git rm lib/stripe.js`; align eslint; add
`"engines": { "node": ">=20" }`. Then Part 3, "Dependencies".

---

### [ ] 26. Privacy details the policy promises but the code doesn't quite keep

**Files:** `app/api/comments/route.js` + `lib/db/comments.js` `getCommentsBySlic`
(returns full `upVotes`/`downVotes` id arrays to every signed-in user; the *voters*
endpoint is members-only, but the ids are already in the comment payload — resolving
them is one `GET /api/users/<id>` each), `app/components/signIn/RequestAccess.jsx` (a
personal mobile number, in a public repo, in a component that is commented out),
`app/privacy/page.jsx` ("Your … lookup history [is] never shown to other drivers" — true;
"anyone can create an account" — not stated, see #8).

**Fix:** `getCommentsBySlic` projects votes to `{ upVoteCount, downVoteCount,
myVote: 'up' | 'down' | null }` computed server-side with the caller's id (the client
already only needs those three); the members-only voters endpoint stays as the one place
names are resolved. Delete `RequestAccess.jsx` or move the number to an env var. Update
the policy to say who can register once #8 is decided.

---

### [ ] 27. Session and token hygiene

**Files:** `auth.config.js`, `auth.js` (`token.comments`, `token.created_at`)

What is right already: JWT strategy, `HttpOnly` + `SameSite=Lax` + `Secure` cookies (Auth.js
defaults), 30-day `maxAge`, a DB re-read of `role`/`bmcMember` on every server request so
demotion is immediate, and `return null` when the user row is gone (documented in
CLAUDE.md — keep the two cases separate).

What to tighten: the token carries `comments` (always `[]`; the field is never written)
and `created_at` — neither is used for authorization and both bloat every request's
cookie. There is no way to invalidate one user's sessions except deleting the row (or
rotating `AUTH_SECRET`, which signs out everyone — write that down as the "we think a
session leaked" procedure, #29). The Edge middleware's `bmcMember` check reads the
token, which is refreshed at most every 24 h (`updateAge`), so it can lag the DB by a
day — harmless because `/history` re-checks, but it means middleware must never be the
only membership gate.

**Fix:** trim the token to `{ id, role, bmcMember, sessionVersion }`; add
`users.sessionVersion` (int, default 0) that the `jwt` callback compares — bump it on
password change (#9), on admin-forced sign-out, on role demotion. One field gives you
per-user revocation without moving to database sessions.

---

### [ ] 28. CSRF: currently safe by construction — keep it that way, and say why

**Files:** every `app/api/**/route.js`, `vercel.json` (deleted 2026-09-20 — good)

Cross-site requests cannot reach the mutating routes today because: (1) the session
cookie is `SameSite=Lax`, so it is not sent on cross-site `POST`/`PATCH`/`DELETE`; (2)
there are no CORS headers, so a cross-origin `fetch` with a JSON body fails preflight;
(3) Auth.js protects its own endpoints with a CSRF token. This is the correct posture and
it is fragile in one specific way: the day someone adds `Access-Control-Allow-Origin: *`
"for an Expo experiment" again (`SUGGESTIONS.md` #22), or switches the cookie to
`SameSite=None` for an embedded use, every route becomes CSRF-able.

**Fix:** no code today. Add to `route()` (#4) a cheap belt-and-braces check for
non-`GET` requests: `Sec-Fetch-Site` must be `same-origin` or absent (old browsers), else
403. Add the rule to Part 3: **no CORS headers on `/api/*`, ever; the app has no
cross-origin clients.**

---

### [ ] 29. Secrets: inventory, rotation, and an incident runbook

**Files:** `.env.example` (accurate today — good; `NEXT_PUBLIC_APP_URL`,
`BLOB_STORE_ID`, `BLOB_WEBHOOK_PUBLIC_KEY` exist in `.env` but nothing reads them),
`.gitignore` (`.env*` ignored, `.env.example` whitelisted — good), git history (no
committed secrets found by pattern scan — good)

Nothing is leaking. What is missing is the plan for when something does. Write this
section once so it is not invented at 2 a.m.:

| Secret | If it leaks | Rotate by | Side effect |
|---|---|---|---|
| `AUTH_SECRET` | Forged sessions for any user incl. admin | `npx auth secret`, update Vercel, redeploy | Everyone signed out |
| `MONGODB_URI` | Full DB read/write | Atlas → Database Access → edit user password; update Vercel | None if done in one deploy |
| `AUTH_GOOGLE_SECRET` | Phishable OAuth flow | GCP → create new client secret, update, then delete old | None |
| `BLOB_READ_WRITE_TOKEN` | Upload/delete any PDF | Vercel → Storage → regenerate | None |
| `GEMINI_API_KEY` | Your bill | Google AI Studio → regenerate | None |
| `BMC_WEBHOOK_SECRET` | Anyone can grant membership | BMC dashboard → new secret, update Vercel | None |

Add: rotate all six on any suspected laptop compromise; rotate `AUTH_SECRET` and
`MONGODB_URI` on a schedule (yearly is fine); keep `.env` out of cloud-synced folders;
`vercel env pull` only onto encrypted disks. If the roster history rewrite (#1) is done
by someone other than you, rotate everything after they are done.

---

### [ ] 30. Small things (each is a one-liner; batch them)

- `app/api/comments/route.js`: `{ error }` bodies returned with status 200 — use 400/500.
- `app/api/cover/[position]/route.js`: guard `Number.isNaN(posInt)` → 400.
- `app/api/drivers/[id]/route.js`, `comments/[commentId]/vote/route.js`: `ObjectId.isValid`
  before `new ObjectId` → 400 not 500.
- `app/api/auth/register/route.js`: escape `<>&"` in the initials before the SVG;
  reject whitespace-only names; cap lengths.
- `app/cover-bid-jobs/page.jsx`: fetches the jobs *before* checking the session — move the
  check first (no leak, just wasted queries for anonymous hits).
- `app/covers/page.jsx`: `getDriverById(userData.driverId)` throws for a user with no
  `driverId` → error page instead of the "not linked" message.
- `next.config.mjs`: `poweredByHeader: false`.
- `app/components/home/MapPhoneLinks.jsx`: `rel="noopener"` on the `target="_blank"`
  links (modern browsers imply it; older WebViews don't).
- `lib/format.js` `isMobileDevice`: fine, but it is a UA sniff used for nothing
  security-relevant — keep it that way.

---

## Part 3 — Standing practices

These are the rules that keep Part 2 from refilling. They are short on purpose; put them
in `CLAUDE.md` (the "Auth" and "API routes" sections already say half of this) and in a
PR checklist.

### Every route handler and page

1. First statement is `await requireUser()` / `requireAdmin()` / `requireMember()` from
   `lib/authz.js`. No handler calls `auth()` directly. A `GET` is not exempt — the
   middleware never covers `/api/*`, and `SUGGESTIONS.md` #22 is what "it's only a read"
   looks like in production.
2. The body goes through `parseBody(request, Schema)`; route params go through
   `ObjectId.isValid` (or a regex for `numSlic`). Unknown keys are a 400 (`.strict()`).
   The handler never spreads a request body into `$set`.
3. Identity comes from the session (`user.id`), never from the body or the URL — a
   `userId` in the URL is a *target*, and the handler decides whether the caller may act
   on it (`target === user.id || user.role === 'admin'`).
4. Errors: `{ error: string }`, status ≥ 400, human-readable, never `error.message` from a
   caught exception. Log the exception with the route and the ids, not the body.
5. Anything a driver will render as HTML is sanitized on write **and** on read through
   `lib/commentHtml.js`. Everything else is rendered as text (React escapes it).
6. Any change to `users`, `slics`, roles, membership or the roster writes a history /
   audit entry in the same transaction.
7. New mutating route → pick a named rate-limit policy from `lib/rateLimit.js`.

### Data layer (`lib/db/*.js`)

- Never `'use server'`. These modules are libraries for server code, not endpoints.
- Functions that return user documents take a projection; `password` is never in one.
  The only reader of the hash is `authorize()`.
- Serializers pick fields (`toPublicUser`, `toSelfUser`, `toAdminUser`); no `{ ...doc }`
  toward a client component.
- New collection → unique indexes, a `$jsonSchema`, a retention decision (TTL or
  "kept while the account exists" + a line in `deleteUserAccount`), and a line in the
  privacy page. Those four are one PR.
- Mutations to audited collections go through the `lib/db/*.js` function that writes
  history — CLAUDE.md already says this for `slics`; it applies to everything in #17.

### Sessions and identity

- `session.user` is trusted *only* because `auth.js` re-reads the row on every server
  request. If that lookup is ever removed for performance, every role check in the app
  becomes 24 hours stale — add `sessionVersion` (#27) first.
- Middleware is UX. It may redirect; it may not be the only thing standing between a
  request and data.
- Look users up by `_id`, never by email. Email is contact info, not identity.

### Logging

- Log ids, counts, field names, error classes. Never: documents, request bodies,
  passwords or hashes, emails, phone numbers, tokens, session objects.
- A bare `catch {}` is a bug. At minimum `console.error(routeName, error)`.

### Dependencies

- `npm audit --omit=dev` before every deploy; anything `high`/`critical` in `next`,
  `next-auth`, `@auth/*`, `mongodb`, `bcryptjs`, `html-react-parser`, `sanitize-html` is
  fixed before the deploy.
- Turn on Dependabot security updates for the repo (Settings → Code security). Merge
  patch releases of `next` and `next-auth` within a week of publication; they ship
  security fixes as patches (#3 is what a year of not doing this looks like).
- Watch two feeds: `github.com/vercel/next.js/security/advisories` and
  `github.com/nextauthjs/next-auth/security/advisories`.
- Adding a dependency: check its weekly downloads, last publish date and whether its
  name is one letter away from something popular. `crypto@1.0.1` (#25) is the cautionary
  tale already in `package.json`.

### Secrets and environments

- `.env.example` lists every key the code reads and nothing else (CLAUDE.md rule; keep
  it). A `process.env.X` read with no `.env.example` line fails review.
- Three environments, three sets of secrets, two databases (prod, dev/preview). Preview
  deployments are password-protected.
- Rotation table in #29. Rotate on suspicion, not on proof.
- GitHub: secret scanning + push protection on; branch protection on `main` (at least
  "require a PR", even for a solo repo — it forces a diff review before production).

### Testing the boundary

There is no test suite. The cheapest one that would have caught every security item in
`SUGGESTIONS.md` and #5/#7 here is a **route enumeration test**: import every
`app/api/**/route.js`, call every exported method with a request that has no session
(mock `@/auth` to return `null`, then to return a `{ user: { role: 'user' } }`), and assert
401 (then 403 for the admin-only list). Vitest, one file, ~60 lines, runs in seconds,
runs in CI. Add a second file that hits `/admin/*` pages the same way once #7 is done.
Extend it when a route is added; it is the list of routes.

### Before shipping a security change

- `npm run build` (lint currently fails on its own config — fix it in #25; until then
  build is the gate).
- Both sign-in paths on a phone, in the installed PWA if the change touches sessions
  or headers (#12).
- The change is reversible: additive fields, a script with `--dry-run` and a
  `rollback` twin, one commit per step. Production is a building full of drivers on a
  shift; "roll forward" is not a plan at 4 a.m.
- Run `/security-review` on the branch; read what it says, not just whether it's green.

### Privacy, standing

- The privacy page is generated from the same constants the code uses for retention,
  and it is edited in the same PR as any new collection, third party, or field.
- Data minimization is a review question: "do we need to store this?" Employee IDs,
  full phone numbers, and per-lookup rows are the three to keep asking about.
- Requests to correct or delete roster data (the policy promises this) have an owner:
  you. Keep a note of how to do it (`db.drivers.deleteOne`, then anonymize
  `cover-bid-jobs.assignedDriver`?) so the promise costs five minutes, not an evening.

---

## Part 4 — Summary

| # | Finding | Severity | Effort |
|---|---|---|---|
| 1 | Driver PII in public git history (defers to `STRUCTURE.md` #4) | Critical | Small + a support ticket |
| 2 | Stored XSS through comments | Critical | Medium |
| 3 | Next.js / Auth.js behind on security fixes | Critical | Small (upgrade + regression walk) |
| 4 | `if (!session)` fails open; centralize guards | Critical | Medium (mechanical) |
| 5 | `'use server'` exposes `commentsApi` unauthenticated | Critical | Trivial |
| 6 | Password hashes / emails sent to the browser | High | Small |
| 7 | Layout-only auth for `/admin/*`; `/bids` middleware-only | High | Small |
| 8 | Open registration, no email verification, account squatting | High | Decision + Medium |
| 9 | No login rate limit / lockout / reset / MFA | High | Medium |
| 10 | Mass assignment in PATCH routes | High | Small |
| 11 | Ad hoc input validation | Medium | Medium |
| 12 | No security headers / CSP | High | Small (step 1), Medium (nonces) |
| 13 | PDFs reachable without sign-in | Medium | Small–Medium |
| 14 | Webhook compare / replay / email-keyed | Medium | Small |
| 15 | No unique indexes | Medium | Small |
| 16 | No schema validation | Medium | Small |
| 17 | Audit-trail holes | Medium | Small |
| 18 | Hard deletes orphan by `numSlic` | Medium | Medium |
| 19 | Self-demotion / last admin / email-keyed identity | Medium | Trivial |
| 20 | Confirm Atlas / Vercel / GCP configuration | Medium | Checklist |
| 21 | Retention (TTL, anonymize stamps) | Medium | Small |
| 22 | PII in logs | Medium | Trivial |
| 23 | `error.message` in responses | Low | Trivial with #4 |
| 24 | Rate-limit coverage | Medium | Small |
| 25 | Dependency hygiene (`crypto`, `stripe`, eslint) | Low | Trivial |
| 26 | Vote arrays / policy wording | Low | Small |
| 27 | Token contents, per-user revocation | Low | Small |
| 28 | CSRF posture (keep) | Info | Trivial |
| 29 | Secrets rotation runbook | Info | Writing |
| 30 | One-liners | Low | Trivial |

**Suggested order:** 1 → 5 → 4 → 3 → 2 → 6 → 7 → 12 (step 1) → 10 → 8 (decide) → 9 →
then Tier 2 in any order. Items 1, 5, 4 and 6 are an afternoon; they remove the
"anonymous attacker" and "hash to browser" classes entirely.
