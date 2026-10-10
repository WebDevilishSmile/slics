# OPERATIONS.md

How the app runs in production: deploying, configuration, the scheduled and inbound jobs,
the scripts, secrets, and what to do when something breaks. For *how the code is
organized*, see `CLAUDE.md`. For each collection, see `DATA-MODEL.md`.

The app is used daily by drivers on shift. Prefer changes you can undo: additive fields, a
script with `--dry-run` and a reverse twin, one commit per step.

---

## Deploying

- **Production is `main`.** Vercel builds and deploys every push to `main`
  (`slics.vercel.app`). There's no staging step, so work on a branch and merge when it's
  ready.
- **The gate is `npm run build`**, run in a scratch copy of the repo, never while
  `next dev` is running in the same folder (both write `.next/`). `npm run lint` and
  `npm run lint:dead` (knip) also work. There's no test suite.
- **Watch the deploy:** `vercel ls` for the newest deployment, then
  `vercel inspect <url> --wait` until it's Ready.
- **Check it on a phone** in light and dark mode, signed in, for anything a driver
  touches. For sign-in or session changes, walk both the Google and the email/password
  paths, in the installed home-screen app too.
- **Commit messages** start with the date and time from `date`, as `M/D/YYYY HH:MM`,
  followed by one change ("10/10/2026 13:31 Jobs: alert the admin to …"). Docs get their own
  commit ("… Docs: …").
- **Rolling back:** in the Vercel dashboard, promote the previous deployment (Instant
  Rollback). It's faster than a revert commit, and it doesn't touch the data.

## Configuration

`.env.example` lists every variable the code reads, with a comment on each. Locally, copy it
to `.env`. In production the same keys are set on the Vercel project.

> **Local `.env` points at the production database.** `npm run dev`, every script and
> every test run hit live data. Until there's a dev database (`SECURITY.md` #20), only
> write to it on purpose, and delete test data afterwards.

## What runs on its own

| What | When | Where | Auth |
|---|---|---|---|
| Daily sheet re-read (Jobs + this week on) | 10:00 UTC daily (`vercel.json`), production only, sometime within that hour | `GET /api/cron/on-call-sheet-sync` | `Authorization: Bearer $CRON_SECRET`, sent by Vercel |
| Sheet notifier ping | When the sheet's `Jobs` tab or a dated tab is edited | `POST /api/webhooks/on-call-sheet` | `x-sheet-secret` = `ON_CALL_SHEET_WEBHOOK_SECRET` |
| Buy Me a Coffee events | Every delivery (saved to `bmc-events`); membership started / cancelled also sets `bmcMember` | `POST /api/webhooks/buymeacoffee` | HMAC SHA-256 with `BMC_WEBHOOK_SECRET`, constant-time; repeats are no-ops (`BMC-SUPPORT.md`) |

The sheet notifier is an Apps Script in the admin's Google account. Install, test and
uninstall steps are in `on-call-sheet-apps-script.md`. Whether it's working shows under the
Refresh button on `/admin/jobs` ("Sheet notifier: last ping …"). After 2 days with no ping,
the page warns.

## Scripts

All run locally against whatever `MONGODB_URI` in `.env` points at, which today is
production.

| Command | Does | Notes |
|---|---|---|
| `npm run db:indexes` | Creates the indexes in `scripts/createIndexes.js` | Safe to re-run. Run it after adding an index there |
| `npm run sheet:preview -- YYYY-MM-DD [--tabs]` / `-- --jobs` | Prints what a sheet refresh would save | Never writes |
| `npm run bmc:import -- <file> --dry-run` / `-- --undo` | Imports Buy Me a Coffee history pulled with the `buymeacoffee` MCP tools into `bmc-events` (`BMC-SUPPORT.md`) | Drop `--dry-run` to write; re-runs insert nothing; `--undo` deletes only imported rows |
| `npm run pdfs:migrate -- --dry-run` | Copies legacy Supabase PDFs to Vercel Blob and sets `pdfUrl` | Drop `--dry-run` to write |
| `npm run pdfs:rollback -- --dry-run` | Reverses the migration's `pdfUrl` writes | The undo for the above |
| `npm run icons:generate` | Rebuilds the home-screen icons from the logo | Never hand-edit the icons |
| `npm run lint:dead` | knip: unused files, exports and dependencies | |

New data scripts follow the same pattern: `--dry-run` first, a reverse script beside it.

---

## Secrets

Supersedes the table in `SECURITY.md` #29 and adds the four keys that came with the sheet
sync. All live in Vercel's project settings (mark them **Sensitive**) and in the local
`.env`, which never goes in git or a cloud-synced folder.

| Secret | If it leaks | Rotate by | Side effect |
|---|---|---|---|
| `AUTH_SECRET` | Forged sessions for anyone, including the admin | `npx auth secret`, set it on Vercel, redeploy | Everyone is signed out |
| `MONGODB_URI` | Full read/write of the database | Atlas → Database Access → new password; update Vercel and `.env` in one go | None if done in one deploy |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | A phishable copy of the sign-in flow | Google Cloud → the OAuth client → add a new secret, deploy it, delete the old one | None |
| `BLOB_READ_WRITE_TOKEN` | Upload or delete any PDF | Vercel → Storage → the store → regenerate | None |
| `GEMINI_API_KEY` | Charges to the account | Google AI Studio → new key | None (goes away in sheet stage 4) |
| `GOOGLE_SHEETS_API_KEY` | Reads of the sheet; quota use | Google Cloud → Credentials → regenerate. Keep it restricted to the Sheets API | None |
| `ON_CALL_SHEET_ID` | **It's an edit key:** the sheet is shared "anyone with the link can edit" | Can't be rotated by the app. Tell the sheet's owner; only they can change its sharing | The owner's call |
| `ON_CALL_SHEET_WEBHOOK_SECRET` | Anyone can trigger sheet re-reads (rate-limited; data still only comes from the sheet) | `openssl rand -hex 32` → Vercel, then the script's `APP_SECRET` property; run `testPing` | Pings get 403 until both match |
| `CRON_SECRET` | Anyone can trigger the daily re-read | New value on Vercel, redeploy | None |
| `BMC_WEBHOOK_SECRET` | Anyone can grant or revoke membership | BMC dashboard → new secret → Vercel | Events fail until both match |

On a lost or compromised laptop, rotate all of them. Rotate `AUTH_SECRET` and
`MONGODB_URI` about once a year anyway.

---

## When something breaks

**Drivers say lookups fail or the app is down.**
1. Vercel → the project → Logs (runtime errors) and the latest deployment's status.
2. MongoDB Atlas → the cluster's status and connections.
3. If the newest deploy did it, roll back (see "Deploying") and fix forward on a branch.

**The sheet stopped updating.** Open `/admin/jobs`. The health line says what last read
the sheet and whether it failed.
- A Google `404: Requested entity was not found` means `ON_CALL_SHEET_ID` is wrong. A bad
  key answers 400, and an IP-restricted key answers 403.
- "Your sheet script may be off": run `testPing` in the Apps Script (see
  `on-call-sheet-apps-script.md`). A 401/403 there means `APP_SECRET` doesn't match.
- The cron answers 500 while `CRON_SECRET` isn't set on Vercel.
- A layout change in the sheet (a renamed header) makes a refresh stop with a format
  error instead of saving bad data. Fix the parser (`lib/coverSheetParser.js`,
  `lib/jobsSheetParser.js`) and check it with `npm run sheet:preview`.

**A session may have leaked.** Rotate `AUTH_SECRET` (it signs everyone out). There's no
per-user sign-out yet (`SECURITY.md` #27). Deleting a user's row signs that one user out on
their next request.

**A driver asks to be removed from the roster or to have their data deleted.**
- If they have an account, they can delete it themselves from their profile. That removes
  their tips (a placeholder stays where others replied), votes, views, place comments and
  sign-in links.
- For the roster, delete their `drivers` row on `/admin/drivers`.
- Names also appear in the sheet-derived collections (`cover-bid-picks`, `sheet-jobs`,
  `sheet-job-changes`). Those mirror the sheet, so the sheet's owner has to remove them
  at the source.

**A membership didn't apply after someone joined on Buy Me a Coffee.** The webhook matches
on email (case doesn't matter since 2026-10-10). Look for their row in `bmc-events`. A row
with `userId: null` means their BMC email has no app account, and its `type` shows what
BMC sent. If there's no row at all, check the delivery log in BMC's dashboard and the
secret. Membership can be toggled by hand on `/admin/users`.
