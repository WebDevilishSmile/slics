# docs/

Everything written about SLICs that isn't code. The product overview is the root
`README.md`. How the code is organized, and the conventions to follow, is in the root
`CLAUDE.md`.

**Where things are:**

- **The root** holds what's open or current: `TODOS.md` (the hub), the references (how
  the app works now), the plans (features with stages still open) and
  `RECOMMENDATIONS.md` (design notes for ideas).
- **`guides/`**: how-tos for people, not code: the sheet's Apps Script, the tutorial
  videos.
- **`print/`**: the flyers and the sheet conventions, each PDF beside its HTML source.
- **`archive/`**: finished work: `DONE.md`, the plans whose stages all shipped, and the
  closed punch lists.

**One hub, the rest explain.** `TODOS.md` says what there is to do and when. Every other
doc explains something: how a feature is being built (a plan), how the app works (a
reference), or how and why something was built (the archive).

## The hub

| Doc | What it's for |
|---|---|
| [`TODOS.md`](TODOS.md) | **Everything to do, and every idea worth keeping:** Inbox, Now, Waiting, Next, Ideas, Security, Housekeeping. Start here when deciding what to work on, and add new things to its Inbox |

## References: how the app works now

| Doc | What it's for | Read it when |
|---|---|---|
| [`DATA-MODEL.md`](DATA-MODEL.md) | Every MongoDB collection: key, writer, personal data, retention | Adding or querying a collection; answering a privacy question |
| [`OPERATIONS.md`](OPERATIONS.md) | Deploying, configuration, cron and webhooks, scripts, secret rotation, what to do when something breaks | Shipping, rotating a secret, or something's down |
| [`SECURITY.md`](SECURITY.md) | Threat model, findings (with a status table), and the standing rules | Touching auth, an API route, the data layer or a new collection |
| [`ON-CALL-SHEET-SYNC.md`](ON-CALL-SHEET-SYNC.md) | Reading the ON CALL SHEET: the tabs and their layout, the parsers, the sync and its alerts, and "Conventions for the sheet". Every stage is built; it stays here because it changes whenever a parser does | Changing a parser, or when the sheet's layout changes |

## Plans: features with stages still open

One doc per staged feature, in the shape described under "Conventions". `TODOS.md` carries
a line for each open stage or live check and links here.

| Doc | What it's for | Where it stands |
|---|---|---|
| [`COVER-BIDDING.md`](COVER-BIDDING.md) | Driver verification, the drivers' Covers page, cover lists, the Covers hub and History, then picking in the app | Stages 1–2 open to every driver since 2026-11-07; stage 3 (picking) is next |
| [`PUSH-NOTIFICATIONS.md`](PUSH-NOTIFICATIONS.md) | Web push: admin alerts and the sheet digests, drivers' replies, cover drivers' reminders and lists | Live for every driver; "your pick is up" waits on Covers stage 3 |
| [`SLIC-DIRECTIONS.md`](SLIC-DIRECTIONS.md) | The directions PDFs as routes on the card that drivers read, suggest changes to and print, plus documents like a railyard map | Stages 0–3 live 2026-11-12; stage 4 (Google Maps waypoints) on hold |
| [`ROUTE-REVIEW.md`](ROUTE-REVIEW.md) | Claude's review of the 65 directions PDFs (`SLIC-DIRECTIONS.md` stage 0): things to confirm with drivers | Being worked through, route by route |
| [`CREATOR-MODE.md`](CREATOR-MODE.md) | The super admin's switch for recording videos: made-up data on every driver page | Stage 2 built 2026-11-12; the phone check is left |
| [`DEV-DATABASE.md`](DEV-DATABASE.md) | A scrubbed copy of production for local work and previews | Stages 1–2 done 2026-11-12; local dev and Vercel Preview left |
| [`MULTI-HUB.md`](MULTI-HUB.md) | Opening SLICs to other hubs: a shared SLIC directory; per-hub covers, jobs, drivers and admins | Stages 0–1 live 2026-11-12; stage 2 on hold until a hub asks |
| [`RECOMMENDATIONS.md`](RECOMMENDATIONS.md) | Design notes for the ideas in `TODOS.md` → Ideas, numbered (#1–#21). An idea's notes move into its own plan doc when it's committed | Grows |

## Guides (`guides/`)

| Doc | What it's for | Read it when |
|---|---|---|
| [`on-call-sheet-apps-script.md`](guides/on-call-sheet-apps-script.md) | The admin's guide to installing the sheet notifier (Apps Script) | Setting up or fixing the sheet's pings |
| [`VIDEO-SCRIPTS.md`](guides/VIDEO-SCRIPTS.md) | Shot-by-shot scripts for the driver tutorial videos, one per `/help` guide (`components/help/guides.jsx`) | Recording a tutorial |

## Printables (`print/`)

Each PDF is its lowercase `.html` source printed with headless Chrome. The source's top
comment says how, and how its QR code was made and checked. Every name and SLIC in them is
made up.

| PDF | What it's for | Reprint it when |
|---|---|---|
| [`ON-CALL-SHEET-CONVENTIONS.pdf`](print/ON-CALL-SHEET-CONVENTIONS.pdf) | For dispatch, staff and cover drivers: how to keep the sheet so the app reads it right (based on `ON-CALL-SHEET-SYNC.md` → "Conventions for the sheet") | A parser changes what it accepts |
| [`SLICS-FLYER.pdf`](print/SLICS-FLYER.pdf) | The general flyer: a QR code to `www.slics.app`, looking up a SLIC, what's on its card, reading and posting tips | A lookup or tip button is renamed |
| [`COVERS-FOR-DRIVERS.pdf`](print/COVERS-FOR-DRIVERS.pdf) | The Covers flyer: a QR code to `www.slics.app/covers`, what Covers is, getting verified, what the page shows | A Covers button is renamed |
| [`DIRECTIONS-FOR-DRIVERS.pdf`](print/DIRECTIONS-FOR-DRIVERS.pdf) | The directions flyer: a QR code to `www.slics.app/home`, reading a route (ways, Step by step, Read aloud, Print), suggesting one. Its phones show Creator mode's made-up route | A button in the directions sheet is renamed |

## Archive (`archive/`)

Finished work. It's kept because code cites it by path and item number, and because it
explains how and why things were built. Each file opens with a note on when it closed and
where anything left over went.

| Doc | Covered | Closed |
|---|---|---|
| [`DONE.md`](archive/DONE.md) | Everything checked off in `TODOS.md`, by area | Grows; started 2026-10-14 |
| [`BMC-SUPPORT.md`](archive/BMC-SUPPORT.md) | Buy Me a Coffee: recording support, the Supporters page, thank-yous, impact, renewals | Built 2026-10-10; archived 2026-11-13 |
| [`COVER-JOB-HIDING.md`](archive/COVER-JOB-HIDING.md) | An admin hides a cover job from drivers, kept through refreshes; automatic hides | Built 2026-10-12/14; archived 2026-11-13 |
| [`PASSWORD-RESET.md`](archive/PASSWORD-RESET.md) | An admin-made reset link, changing a password on the profile, reset by email | Live 2026-10-12; archived 2026-11-13 (two phone checks in `TODOS.md`) |
| [`STAFF-ROLES.md`](archive/STAFF-ROLES.md) | The Dispatch role, and a switch per admin tool per role | Built 2026-10-16; archived 2026-11-13 |
| [`SUPER-ADMIN-HUB.md`](archive/SUPER-ADMIN-HUB.md) | The super admin's hub at `/admin/super` | Built 2026-10-12; archived 2026-11-13 |
| [`SUGGESTIONS.md`](archive/SUGGESTIONS.md) | First pass: auth on every route, N+1s, indexes, error shape | 2026-10-07 |
| [`STRUCTURE.md`](archive/STRUCTURE.md) | Files and folders, dead code, `utils/` → `lib/`, API path naming | 2026-10-10 (leftovers in `TODOS.md`) |
| [`UI-SUGGESTIONS.md`](archive/UI-SUGGESTIONS.md) | Theme plumbing (#1–#30) and the UI review (#31–#57) | 2026-10-10 (leftovers in `TODOS.md`) |

---

## Conventions

- **One hub.** Open work and ideas go in `TODOS.md`, one line each, linking to the doc
  with the detail. Nothing open hides in a doc that `TODOS.md` doesn't point at. A plan's
  checklists can be as detailed as they need; `TODOS.md` carries one line per open stage
  or live check.
- **How an item moves:** Inbox → Ideas → Next → Now → done.
  - **Inbox:** anything, in any wording, added from anywhere. Sorted the next time we plan.
  - **Ideas:** worth keeping, not committed. One line in `TODOS.md`; longer notes go in
    `RECOMMENDATIONS.md` under a number.
  - **Next:** decided, not started. A staged feature gets a plan doc; its notes move there,
    with the original ask quoted word for word (`COVER-BIDDING.md` → "Why").
  - **Now:** built, waiting on a check on the live site or a step only Tiago can do.
  - **Waiting:** open, but not before a date or a condition.
  - **Done:** check it off, then move it to `archive/DONE.md` under its area, keeping its
    wording and date.
- **A staged feature gets a plan doc** in the root, in the `ON-CALL-SHEET-SYNC.md` shape:
  Status, Why, Ground rules, the stages as checklists naming where the code lives, then
  Verifying. A later stage goes into the same doc, not a new file.
- **When every stage has shipped, the plan moves to `archive/`:** add a note under its
  title (when it closed, what's still open and where), `git mv` it, and update its path
  everywhere in the same commit:
  `git grep -l "docs/NAME.md" | xargs sed -i "s#docs/NAME.md#docs/archive/NAME.md#g"`.
  Live checks still open stay as lines in `TODOS.md`. A doc that describes how something
  works now, and changes with the code, is a reference and stays in the root
  (`ON-CALL-SHEET-SYNC.md`).
- **Names are permanent.** Code cites docs by path (`docs/COVER-BIDDING.md`) and by
  filename, so never rename a doc; its path changes only when it moves to `archive/`.
- **Item numbers are permanent.** Code comments, commit messages and `CLAUDE.md` cite
  punch-list, `SECURITY.md` and `RECOMMENDATIONS.md` items by number. Never renumber or
  reuse one; mark it done or superseded.
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
