# OPERATIONS.md

How the app runs in production: deploying, configuration, the scheduled and inbound jobs,
the scripts, secrets, and what to do when something breaks. For *how the code is
organized*, see `CLAUDE.md`. For each collection, see `DATA-MODEL.md`.

The app is used daily by drivers on shift. Prefer changes you can undo: additive fields, a
script with `--dry-run` and a reverse twin, one commit per step.

---

## Deploying

- **Production is `main`.** Vercel builds and deploys every push to `main`
  (`www.slics.app` since 2026-10-12; `slics.app` redirects there and `slics.vercel.app`
  still answers). The domain is registered with Vercel and uses Vercel DNS, which also
  holds Resend's email records and Google's site verification. Links the app sends out
  use `SITE_URL` (`constants.js`) in production. There's no staging step, so work on a branch and merge when it's
  ready.
- **Email for the domain** (since 2026-10-12), all records on Vercel DNS (`vercel dns ls
  slics.app`):
  - Sending is Resend: the DKIM `TXT` at `resend._domainkey` and the `send` / `rsend`
    CNAMEs. They're subdomains, so they never touch the root.
  - Receiving is **ImprovMX**, which forwards `tiago@slics.app` to the admin's Gmail. It
    uses the root's `MX` records (`mx1`/`mx2.improvmx.com`) and the root SPF `TXT`
    (`v=spf1 include:spf.improvmx.com ~all`). There's only ever one SPF record at the
    root, so add any new sender to that one.
  - DMARC is `_dmarc` `v=DMARC1; p=none;`: it reports nothing and blocks nothing yet.
  - Gmail's "Send mail as" for `tiago@slics.app` sends through Resend's SMTP
    (`smtp.resend.com:587`, user `resend`) with its own `Gmail send-as` key, so it signs
    with slics.app's DKIM like the app's emails.
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
- **New indexes** in `scripts/createIndexes.js` need `npm run db:indexes` once the change
  is deployed. The 2026-10-10 changes added four unique ones: one pending claim per driver,
  one account per sheet name (`users.driver.key`), and on the roster one row per employee
  ID and per linked sheet name (`drivers.sheetKey`). The 2026-10-12 cover job hiding
  (`COVER-JOB-HIDING.md`) added one on `cover-bid-job-hides`, one per week and job number.
  The 2026-10-12 super admin hub (`SUPER-ADMIN-HUB.md`) added `slicViews.viewedAt` and the
  90-day TTL on `push-log.at`. The 2026-10-12 cover list disputes (`COVER-BIDDING.md`)
  added `cover-disputes`, including a unique one: one open dispute per driver. The
  2026-10-14 cover alerts added `cover-job-changes.seenAt`. The list itself lives in `lib/db/indexSpecs.mjs`, and
  `/admin/super/health` names any index not created yet.
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
| Covers notifications (call-in reminders; call-in and cover-jobs notices) | Every minute (`vercel.json`), production only. **Needs Vercel Pro** (the team has been on it since before 2026-10-22): a Hobby cron runs once a day, and a deploy with an every-minute one fails there | `GET /api/cron/cover-notifications` (`lib/coverNotices.js`); `?all=1` runs every part at once | `Authorization: Bearer $CRON_SECRET`, sent by Vercel |
| Sheet notifier ping | When the sheet's `Jobs` tab or a dated tab is edited | `POST /api/webhooks/on-call-sheet` | `x-sheet-secret` = `ON_CALL_SHEET_WEBHOOK_SECRET` |
| Buy Me a Coffee events | Every delivery (saved to `bmc-events`); membership started / cancelled also sets `bmcMember` | `POST /api/webhooks/buymeacoffee` | HMAC SHA-256 with `BMC_WEBHOOK_SECRET`, constant-time; repeats are no-ops (`BMC-SUPPORT.md`) |

Push notifications go out from the request that caused them, after its response
(`lib/pushEvents.js`, `PUSH-NOTIFICATIONS.md`): Jobs-tab and cover-week changes from a
sheet read (each naming the jobs), SLIC reports, tips, claims, cover list disputes, sign-ups, Places, SLIC edits and Buy Me a Coffee events,
each to the admins who chose that kind on `/profile`; a reply on a tip or a comment on a
place, to the drivers in that thread (or who added the place) who have a device on; and a
job taken off a verified driver's cover list, to that driver. Drivers get the reply kinds
only while "Notifications for every driver" is on (`/admin/super/features`), unless
they're verified for Covers; turning it off stops the rest at once, which is the rollback.
The scheduled ones are the Covers notifications above (`PUSH-NOTIFICATIONS.md` stage 3):
the cron reminds verified drivers before their call-in on bid day, and tells them about
their place on a week's pick list and the week's jobs once the sheet has gone quiet. What
it has told is in `cover-notices`, so a repeated run tells nobody twice. To check it by
hand: `vercel crons run /api/cron/cover-notifications` (it sends for real). Removing its
line from `vercel.json` stops it. With the VAPID keys unset, sends are skipped and logged
("Push is off"). Every send that reached a device is in `push-log` for 90 days, on
`/admin/super/notifications`.

**`/admin/super/health`** (super admin) checks the rest at a glance: which keys are set
(never their values), the sheet's last read and ping, push failures, the PDF migration,
missing indexes and the deploy's commit.

The sheet notifier is an Apps Script in the admin's Google account. Install, test and
uninstall steps are in `on-call-sheet-apps-script.md`. Whether it's working shows under the
Refresh button on `/admin/jobs` ("Sheet notifier: last ping …"). After 2 days with no ping,
the page warns.

## Scripts

All run locally against whatever `MONGODB_URI` in `.env` points at, which today is
production.

| Command | Does | Notes |
|---|---|---|
| `npm run db:dev-seed -- --dry-run` | Copies production into the dev database (`DEV_MONGODB_URI`) with people swapped for made-up ones, dropping tokens, push addresses, money and employee IDs, and adds the test accounts (`DEV-DATABASE.md`) | Reads production only. Drop `--dry-run` to write; it replaces the dev collections each time and refuses a database without "dev" in its name |
| `npm run db:indexes` | Creates the indexes listed in `lib/db/indexSpecs.mjs` (`scripts/createIndexes.js`) | Safe to re-run. Run it after adding an index there; `/admin/super/health` shows any missing |
| `npm run sheet:preview -- YYYY-MM-DD [--tabs]` / `-- --jobs` | Prints what a sheet refresh would save | Never writes |
| `npm run admin:super -- <email> --dry-run` / `-- <email> --undo` | Makes an account super admin (and admin), or takes super admin away | Drop `--dry-run` to write; the only way to change it; each change is logged in `admin_audit` |
| `npm run password:reset-link -- <email> --dry-run` | Prints a one-time reset link (24 hours) for a password account, including the ones `/admin/users` won't make one for: a super admin's, your own (`PASSWORD-RESET.md`) | Drop `--dry-run` to make it; `-- <email> --origin http://localhost:3000` for a local server; logged in `admin_audit` with no actor |
| `npm run comments:to-text -- --dry-run` / `-- --undo` | Converts the old Tiptap HTML tips to plain text (`SECURITY.md` #2) | Drop `--dry-run` to write; keeps the HTML in `content_html`; `--undo` restores it except on comments edited since |
| `npm run bmc:import -- <file> --dry-run` / `-- --undo` | Imports Buy Me a Coffee history pulled with the `buymeacoffee` MCP tools into `bmc-events` (`BMC-SUPPORT.md`) | Drop `--dry-run` to write; re-runs insert nothing; `--undo` deletes only imported rows |
| `npm run pdfs:migrate -- --dry-run` | Copies legacy Supabase PDFs to Vercel Blob and sets `pdfUrl` | Drop `--dry-run` to write |
| `npm run pdfs:rollback -- --dry-run` | Reverses the migration's `pdfUrl` writes | The undo for the above |
| `npm run icons:generate` | Rebuilds every app icon and `app/favicon.ico` from `public/slics-icon.svg` | Never hand-edit the icons |
| `npm run lint:dead` | knip: unused files, exports and dependencies | |

New data scripts follow the same pattern: `--dry-run` first, a reverse script beside it.

---

## Secrets

Supersedes the table in `SECURITY.md` #29 and adds the four keys that came with the sheet
sync, and the push keys (`PUSH-NOTIFICATIONS.md`). All live in Vercel's project settings (mark them **Sensitive**) and in the local
`.env`, which never goes in git or a cloud-synced folder.

| Secret | If it leaks | Rotate by | Side effect |
|---|---|---|---|
| `AUTH_SECRET` | Forged sessions for anyone, including the admin | `npx auth secret`, set it on Vercel, redeploy | Everyone is signed out |
| `MONGODB_URI` | Full read/write of the database | Atlas → Database Access → new password; update Vercel and `.env` in one go | None if done in one deploy |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | A phishable copy of the sign-in flow | Google Cloud → the OAuth client → add a new secret, deploy it, delete the old one | None |
| `BLOB_READ_WRITE_TOKEN` | Upload or delete any PDF | Vercel → Storage → the store → regenerate | None |
| `GOOGLE_SHEETS_API_KEY` | Reads of the sheet; quota use | Google Cloud → Credentials → regenerate. Keep it restricted to the Sheets API | None |
| `ON_CALL_SHEET_ID` | **It's an edit key:** the sheet is shared "anyone with the link can edit" | Can't be rotated by the app. Tell the sheet's owner; only they can change its sharing | The owner's call |
| `ON_CALL_SHEET_WEBHOOK_SECRET` | Anyone can trigger sheet re-reads (rate-limited; data still only comes from the sheet) | `openssl rand -hex 32` → Vercel, then the script's `APP_SECRET` property; run `testPing` | Pings get 403 until both match |
| `CRON_SECRET` | Anyone can trigger the daily re-read, or run the Covers notifications early (they still send each notice once, at its time or after) | New value on Vercel, redeploy | None |
| `BMC_WEBHOOK_SECRET` | Anyone can grant or revoke membership | BMC dashboard → new secret → Vercel | Events fail until both match |
| `RESEND_API_KEY` | Anyone can send email as `@slics.app` (phishing your drivers from your domain) | Resend → API Keys → make a new "Sending access" key for slics.app, set it on Vercel, redeploy, delete the old key | None; resets requested mid-swap may not send |
| Resend key `Gmail send-as` (in Gmail, not the app) | Same as above | Resend → API Keys → a new "Sending access" key for slics.app, paste it in Gmail → Settings → Accounts → "Send mail as" → edit info, delete the old key | Sending as `tiago@slics.app` fails until Gmail has the new key |
| `VAPID_PRIVATE_KEY` (with `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`) | Anyone with a device's subscription could push to it as the app; the subscriptions themselves stay on the server | `npx web-push generate-vapid-keys`, set **both** keys on Vercel, redeploy (the public key is built into the client) | **Every device's subscription stops working.** Everyone turns notifications off and on again on `/profile`; the toggle notices a subscription made with the old key and replaces it |

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
- The cron answers 500 if `CRON_SECRET` isn't set on Vercel (it has been since 2026-10-10).
- A layout change in the sheet (a renamed header) makes a refresh stop with a format
  error instead of saving bad data. Fix the parser (`lib/coverSheetParser.js`,
  `lib/jobsSheetParser.js`) and check it with `npm run sheet:preview`.

**An image, script or embed doesn't load, and the browser console says "Refused to load…
Content Security Policy".** The origin isn't in the CSP in `next.config.mjs` (`csp`, see
`SECURITY.md` #12). Add it to the matching directive and redeploy.

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
