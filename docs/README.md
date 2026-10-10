# docs/

Everything written about SLICs that isn't code. The product overview is the root
`README.md`. How the code is organized, and the conventions to follow, is in the root
`CLAUDE.md`.

## Start here

| Doc | What it's for | Read it when |
|---|---|---|
| [`TODOS.md`](TODOS.md) | **The one live to-do list:** time-bound items, features, security, housekeeping, and what's done | Deciding what to work on |
| [`RECOMMENDATIONS.md`](RECOMMENDATIONS.md) | Ideas not yet adopted, starting with designs for the features in `TODOS.md` | Planning a feature |

## Reference

| Doc | What it's for | Read it when |
|---|---|---|
| [`DATA-MODEL.md`](DATA-MODEL.md) | Every MongoDB collection: key, writer, personal data, retention | Adding or querying a collection; answering a privacy question |
| [`OPERATIONS.md`](OPERATIONS.md) | Deploying, configuration, cron and webhooks, scripts, secret rotation, what to do when something breaks | Shipping, rotating a secret, or something's down |
| [`SECURITY.md`](SECURITY.md) | Threat model, findings (with a re-checked status table), and the standing rules | Touching auth, an API route, the data layer or a new collection |

## Features

| Doc | What it's for |
|---|---|
| [`ON-CALL-SHEET-SYNC.md`](ON-CALL-SHEET-SYNC.md) | The plan, layout notes and checklist for reading the ON CALL SHEET (cover weeks, the Jobs tab, alerts). Stages 1–3 built |
| [`on-call-sheet-apps-script.md`](on-call-sheet-apps-script.md) | The admin's guide to installing the sheet notifier (Apps Script) |

## Archive

Finished punch lists. They're kept because code comments cite their item numbers
(`UI-SUGGESTIONS.md #17`, `STRUCTURE.md #21`, `SUGGESTIONS.md #14`), and because each item
explains why a convention exists. Each file opens with a note on what moved out of it.

| Doc | Covered | Closed |
|---|---|---|
| [`archive/SUGGESTIONS.md`](archive/SUGGESTIONS.md) | First pass: auth on every route, N+1s, indexes, error shape | 2026-10-07 |
| [`archive/STRUCTURE.md`](archive/STRUCTURE.md) | Files and folders, dead code, `utils/` → `lib/`, API path naming | 2026-10-10 (leftovers in `TODOS.md`) |
| [`archive/UI-SUGGESTIONS.md`](archive/UI-SUGGESTIONS.md) | Theme plumbing (#1–#30) and the UI review (#31–#57): contrast, phone layout, the lookup screen, motion | 2026-10-10 (leftovers in `TODOS.md`) |

---

## Conventions

- **One live list.** Open work goes in `TODOS.md`. A big area can have its own doc with
  the detail (`SECURITY.md`, a feature plan), but `TODOS.md` carries a line pointing at
  it, so nothing open hides in a doc nobody opens.
- **Item numbers are permanent.** Code comments, commit messages and `CLAUDE.md` cite
  punch-list items by number. Never renumber or reuse one; mark it done or superseded.
- **Filenames are permanent too.** Code cites docs by filename, and sometimes by path
  (`docs/ON-CALL-SHEET-SYNC.md` appears in about 20 files). Moving a doc between folders
  is fine as long as the name stays. Renaming one means updating every citation
  (`git grep -n "<NAME>.md"`).
- **Mark status in place.** `- [x]` / `- [ ]` for checklists, and a `**Done YYYY-MM-DD.**`
  line under an item saying what actually shipped, especially when it differs from the
  plan.
- **Absolute dates,** never "yesterday" or "last week".
- **When a punch list closes,** move it to `archive/`, add a note under its title naming
  where any leftovers went, and add a row to the table above.
- **A staged feature gets a plan doc** in the `ON-CALL-SHEET-SYNC.md` shape: Status, Why,
  Ground rules, the stages as checklists naming where the code lives, then Verifying.
- **No secrets, ids or personal data** in docs: no sheet id, no connection strings, no
  driver names or phone numbers. The repo is public.
- **Update the references in the same commit** as the change that makes them wrong: a
  collection (`DATA-MODEL.md`), an env var, cron, webhook or script (`OPERATIONS.md`,
  `.env.example`).
