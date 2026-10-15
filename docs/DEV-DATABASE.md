# DEV-DATABASE.md

A database for local work and preview deployments, filled with a copy of production that
has the people taken out (`SECURITY.md` #20, `RECOMMENDATIONS.md` #15).

## Why

`.env` points at production. So `npm run dev`, every script and every "quick check" run
against the live database, and anything clicked locally happens for real. Checking a
signed-in screen meant either a driver's own phone or a scratch preview page with made-up
data. A dev copy lets the app run locally as an admin and as a driver, with realistic
sheets, cover weeks and SLICs, and nothing anyone did there reaches a driver.

## Status (2026-10-14)

- Stage 1 is built: the seed script, dry-run checked against production.
- Stage 2 waits on an Atlas user (below).
- Stages 3 and 4 follow.

## Stage 1 — The seed script (built 2026-10-14)

`npm run db:dev-seed` (`scripts/seedDevDb.mjs`). `-- --dry-run` reads and reports without
writing.

- **Reads production** with `MONGODB_URI`, using `find` only.
- **Writes the dev database** with `DEV_MONGODB_URI`.
  - It refuses a database whose name doesn't contain "dev", or one with the same name as
    production's (`test`).
  - Each run drops the dev collections it writes and copies them fresh, so re-running is
    how the copy is refreshed.
- **Each collection is kept, scrubbed or dropped** (`PLAN` in the script):
  - **Kept:** SLICs, hubs, places, tips and comments (drivers' public words), lookups
    (without private notes), report kinds (the notes are replaced), the push log, sync
    state, feature switches.
  - **Scrubbed:** accounts (made-up names, `user<N>@example.test`, no password, phone or
    picture), the roster (no employee ID or phone), and every driver name on the Jobs tab,
    the cover tabs, picks and change logs.
    - Each real driver name gets the same made-up name everywhere, so the sheets still line
      up. The dry run prints the matches before and after, and they're equal: 21 pick names
      on the Jobs tab, 91 cover-job names on the picks, 4 account links.
    - Admin stamps (`{ id, name, email }`) get the account's made-up name and no email.
    - Audit rows lose supporter details.
  - **Dropped:** OAuth tokens (`accounts`), `sessions`, push addresses, password resets,
    rate limits, Buy Me a Coffee events, driver claims and disputes (employee IDs), and the
    old cover/bid lists.
- **A leak check runs before anything is written.**
  - It compares every string in the scrubbed collections with every real email, name,
    phone and employee ID.
  - On any match it stops and prints only where: the collection and field, never the value.
  - The 2026-10-14 dry run: 331 last names swapped, 0 left.
- **Two test accounts** are added, from `TEST_ACCOUNT_EMAIL` / `TEST_ACCOUNT_PASSWORD` in
  `.env.local`:
  - the address itself, a super admin linked to a driver covering a job in the newest
    posted week. It's super admin on the copy only, so the feature switches and hub pages
    can be tried there;
  - `+driver` on the same address, a plain user linked to a driver on their own job.
- **The indexes** are built from `lib/db/indexSpecs.mjs`.

## Stage 2 — The Atlas user and the first copy (the admin)

1. **Atlas → Database Access → Add New Database User.**
   - Password authentication, username `slics-dev`.
   - Built-in role: none. Under **Specific Privileges**, add `readWrite` on database
     `slics-dev` only. It must not be able to read `test`.
2. **Copy the cluster's connection string**, change the user and password to the new ones,
   and put `/slics-dev` in the path: `mongodb+srv://slics-dev:<password>@<cluster>/slics-dev?retryWrites=true&w=majority`.
3. **Add it to `.env`** as `DEV_MONGODB_URI=…`.
4. **Run** `npm run db:dev-seed -- --dry-run`, then `npm run db:dev-seed`.

## Stage 3 — Local work on the dev copy

- **`.env.development.local`** with `MONGODB_URI=<the dev URI>`.
  - `next dev` loads that file over `.env`, so `npm run dev` uses the copy.
  - `next build`, `next start` and the `scripts/*` tasks keep reading `.env`, so they stay
    on production, on purpose.
- **Sign in locally** with the test accounts.
  - Google sign-in on localhost needs `http://localhost:3000/api/auth/callback/google` on
    the OAuth client; the email accounts don't.
  - Push works on `http://localhost`.
- **A warning in `lib/db/client.js`** (to build): under `next dev`, a connection to `test`
  logs a loud one-time warning, so pointing at production is never silent.

## Stage 4 — Vercel Preview on the dev copy

- Set `MONGODB_URI` for the **Preview** environment to the dev URI, so a branch deployment
  never touches production.
- Then turn on Deployment Protection for previews (`SECURITY.md` #20's second half).
- Keep the cron and webhooks pointed at production only. They're production-only already
  (`vercel.json`, `OPERATIONS.md`).

## Verifying

- **The dry run** reports 0 leaks and equal match counts before and after.
- **After the first copy:** sign in on `npm run dev` as the test super admin. `/profile` shows
  This week as a cover driver, `/admin/users` shows only made-up names, and the drivers
  page has no employee IDs or phones.
- **Then the plain test driver:** with Covers closed, `/profile` has no This week, as on
  production. Turn on "Covers for every driver" on the copy's `/admin/super/features`, and
  it shows their own job.
