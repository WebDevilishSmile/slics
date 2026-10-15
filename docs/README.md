# docs/

Everything written about SLICs that isn't code. The product overview is the root
`README.md`. How the code is organized, and the conventions to follow, is in the root
`CLAUDE.md`.

**One hub, the rest explain.** `TODOS.md` says what there is to do and when: tasks, checks
on the live site, dated chores and ideas, one line each. Every other doc here explains
something: how a feature will be built (a plan), how the app works (a reference), or why a
convention exists (the archive).

## The hub

| Doc | What it's for |
|---|---|
| [`TODOS.md`](TODOS.md) | **Everything to do, and every idea worth keeping:** Inbox, Now, Waiting, Next, Ideas, Security, Housekeeping. Start here when deciding what to work on, and add new ideas to its Inbox |

## Plans: how we'll build it

One doc per staged feature, in the shape described under "Conventions". `TODOS.md` carries
a line for each open stage and links here.

| Doc | What it's for |
|---|---|
| [`COVER-BIDDING.md`](COVER-BIDDING.md) | Driver verification, the drivers' Covers page, preference lists, then picking in the app. Stages 1–2 built, admin-only until rollout |
| [`PUSH-NOTIFICATIONS.md`](PUSH-NOTIFICATIONS.md) | Web push: admin alerts (stages 1, 1b live), every driver's tip and place replies (stage 2, built 2026-10-14, switch off), then "your pick is up" |
| [`ON-CALL-SHEET-SYNC.md`](ON-CALL-SHEET-SYNC.md) | Reading the ON CALL SHEET: cover weeks, the Jobs tab, alerts. Stages 1–3 built |
| [`COVER-JOB-HIDING.md`](COVER-JOB-HIDING.md) | An admin hides a cover job from drivers' `/covers`, and the hide survives sheet refreshes. Built 2026-10-12 |
| [`BMC-SUPPORT.md`](BMC-SUPPORT.md) | Buy Me a Coffee: recording support, the Supporters page, thank-yous, impact numbers, renewals. Built |
| [`DEV-DATABASE.md`](DEV-DATABASE.md) | A scrubbed copy of production for local work and previews: the seed script (built 2026-10-14), then the Atlas user, local dev and Vercel Preview |
| [`PASSWORD-RESET.md`](PASSWORD-RESET.md) | Forgot password: an admin-made link, change password on the profile, reset by email. Stages 1–3 live |
| [`SUPER-ADMIN-HUB.md`](SUPER-ADMIN-HUB.md) | The super admin's hub at `/admin/super`: numbers and usage, notifications, activity, system health, feature switches. Built 2026-10-12 |
| [`RECOMMENDATIONS.md`](RECOMMENDATIONS.md) | Design notes for the ideas in `TODOS.md` → Ideas, numbered (#1–#20). An idea's notes move into its own plan doc when it's committed |

## Reference: how the app works

| Doc | What it's for | Read it when |
|---|---|---|
| [`DATA-MODEL.md`](DATA-MODEL.md) | Every MongoDB collection: key, writer, personal data, retention | Adding or querying a collection; answering a privacy question |
| [`OPERATIONS.md`](OPERATIONS.md) | Deploying, configuration, cron and webhooks, scripts, secret rotation, what to do when something breaks | Shipping, rotating a secret, or something's down |
| [`SECURITY.md`](SECURITY.md) | Threat model, findings (with a re-checked status table), and the standing rules | Touching auth, an API route, the data layer or a new collection |
| [`on-call-sheet-apps-script.md`](on-call-sheet-apps-script.md) | The admin's guide to installing the sheet notifier (Apps Script) | Setting up or fixing the sheet's pings |
| [`tutorials/VIDEO-SCRIPTS.md`](tutorials/VIDEO-SCRIPTS.md) | Shot-by-shot scripts for the driver tutorial videos, one per `/help` guide (`components/help/guides.jsx`) | Recording a tutorial |

## Archive

Finished lists. The punch lists are kept because code comments cite their item numbers
(`UI-SUGGESTIONS.md #17`, `STRUCTURE.md #21`, `SUGGESTIONS.md #14`), and because each item
explains why a convention exists. Each file opens with a note on what moved out of it.

| Doc | Covered | Closed |
|---|---|---|
| [`archive/DONE.md`](archive/DONE.md) | Everything checked off in `TODOS.md`, by area | Grows; started 2026-10-14 |
| [`archive/SUGGESTIONS.md`](archive/SUGGESTIONS.md) | First pass: auth on every route, N+1s, indexes, error shape | 2026-10-07 |
| [`archive/STRUCTURE.md`](archive/STRUCTURE.md) | Files and folders, dead code, `utils/` → `lib/`, API path naming | 2026-10-10 (leftovers in `TODOS.md`) |
| [`archive/UI-SUGGESTIONS.md`](archive/UI-SUGGESTIONS.md) | Theme plumbing (#1–#30) and the UI review (#31–#57): contrast, phone layout, the lookup screen, motion | 2026-10-10 (leftovers in `TODOS.md`) |

---

## Conventions

- **One hub.** Open work and ideas go in `TODOS.md`, one line each, linking to the doc
  with the detail. Nothing open hides in a doc that `TODOS.md` doesn't point at. A plan
  doc's checklists can be as detailed as they need; `TODOS.md` carries one line per open
  stage or live check.
- **How an item moves:** Inbox → Ideas → Next → Now → Done (`TODOS.md` explains each).
  When an idea is committed, its notes (from the Ideas section or `RECOMMENDATIONS.md`)
  move into a plan doc, and the original ask is quoted there word for word
  (`COVER-BIDDING.md` → "Why").
- **Done goes to the archive.** Check an item off where it is, then move it to
  `archive/DONE.md` under its area, keeping its wording and date.
- **A staged feature gets a plan doc** in the `ON-CALL-SHEET-SYNC.md` shape: Status, Why,
  Ground rules, the stages as checklists naming where the code lives, then Verifying. A
  later stage planned in detail goes into the same doc, not a new file
  (`PUSH-NOTIFICATIONS.md` → "Stage 2").
- **Item numbers are permanent.** Code comments, commit messages and `CLAUDE.md` cite
  punch-list and `RECOMMENDATIONS.md` items by number. Never renumber or reuse one; mark
  it done or superseded.
- **Filenames and paths are permanent too.** Code cites docs by filename, and in 173 files
  by path (`docs/COVER-BIDDING.md`). Renaming or moving a doc means updating every
  citation (`git grep -n "<NAME>.md"`), so keep the folder flat and the names as they are.
- **Mark status in place.** `- [x]` / `- [ ]` for checklists, and a `**Done YYYY-MM-DD.**`
  line under an item saying what actually shipped, especially when it differs from the
  plan.
- **Absolute dates,** never "yesterday" or "last week".
- **When a punch list closes,** move it to `archive/`, add a note under its title naming
  where any leftovers went, and add a row to the table above.
- **No secrets, ids or personal data** in docs: no sheet id, no connection strings, no
  driver names or phone numbers. The repo is public.
- **Update the references in the same commit** as the change that makes them wrong: a
  collection (`DATA-MODEL.md`), an env var, cron, webhook or script (`OPERATIONS.md`,
  `.env.example`).
