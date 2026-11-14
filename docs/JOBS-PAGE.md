# The drivers' Jobs page

`/jobs`: every bid job on the on-call sheet's Jobs tab, for verified drivers, with the
seniority number of the driver on each job and never a name.

## Status

- **Stage 1, the page behind a switch:** built 2026-11-14. Staff with the Jobs tool only
  (admins, by default) until the super admin's "Jobs for verified drivers" switch on
  `/admin/super/features` is turned on. Not yet tried on a phone or in a browser.
- **The rollout** (turning the switch on) waits on the checklist under "Verifying".

## Why

Tiago, 2026-11-14:

> In the SLICs app, I want to add a jobs page for verified drivers, similar to the covers
> page. I want to add a table where drivers can see the jobs but not the drivers on the
> job. Maybe just show the seniority number. I want this to be available for admin only
> at first and have a switch in the super admin page like covers was.

The jobs are already in the app: the sync saves the sheet's Jobs tab to `sheet-jobs`
(`ON-CALL-SHEET-SYNC.md` stage 2) and admins read it, with names, on `/admin/jobs`.

## Ground rules

- **No names.** A driver gets a job only through `toDriverSheetJob` (`lib/serializers.js`),
  which names every field it sends: the job's code, each day's start, hours and miles, the
  description (the route), the week's hours and the seniority number. The `driver` cell is
  never one of them.
- **The seniority number is sent only when the cell is a whole number,** so a name or a
  note typed in that column stays on the server.
- **A seniority number can still point at a person.** Anyone who knows the building's
  seniority list can tell who number 12 is. That's the ask ("maybe just show the
  seniority number") and it's the one thing here another driver could use to tell who
  holds a job, so it's on the rollout checklist to decide with the privacy page. Leaving
  it out is one line in `toDriverSheetJob` and a column in `jobs/JobsBoard.jsx`. It also
  widens the Covers rule that a driver never sees another job's seniority (`toDriverWeek`
  still doesn't send one).
- **"Your job"** marks the reader's own job, worked out on the server from their own linked
  name (`users.driver.key`); nothing about anyone else rides on it.
- **Its own switch.** `jobsOpen` doesn't depend on Covers being open, but a driver can only
  ask to be verified on `/covers`.
- **Read only.** The page shows what the sheet says. It isn't a bid.

## Stage 1: the page behind a switch

- [x] **The switch:** `jobsOpen` in `app-settings` `features` (`lib/db/appSettings.js`;
      `JOBS_OPEN` in `constants.js` is the default, `false`), on every session as
      `session.features.jobsOpen` with `jobsOpenedAt` (`auth.js`), changed on
      `/admin/super/features` (`admin/hub/FeaturesView.jsx`, `PATCH /api/features`,
      `admin_audit` first) and listed on the hub's Features card.
- [x] **The gate:** `jobsAllowed` (`lib/featureAccess.js`, pure) and `canUseJobs`
      (`lib/authz.js`): a super admin, staff whose role has the Jobs tool, or, once the
      switch is on, any verified driver. The page checks it before reading anything.
      Anyone else is sent to `/home`, or to `/covers` once it's open and they could ask to
      be verified.
- [x] **The page:** `app/jobs/page.jsx` reads `getSheetJobs()` and the routes' stops that
      are SLICs (`getSlicsByAlpha`), and hands `jobs/JobsBoard.jsx` only
      `toDriverSheetJob`'s fields. A table from `md` up (every heading sorts), cards on a
      phone (sort chips), a search over job and route, in the sheet's order until sorted.
      Sorting is `lib/jobTable.js`, shared with `/admin/jobs`.
- [x] **A job's details:** `jobs/JobDialog.jsx`, full screen on a phone: seniority, week
      hours and the week as the profile's This week card draws it
      (`covers/JobSchedule.jsx`, without dates), each stop that's a SLIC a link to its
      card. Worked out in the browser (`jobSchedule`, `lib/driverWeek.js`), so the page
      has no API route.
- [x] **The menu:** a Jobs row under Covers (`header/UserMenu.jsx`), "Admin only for now"
      while the switch is off and "New" for `JOBS_NEW_DAYS` (21) after it's turned on.
- [x] **Creator mode:** `creatorJobs()` (`lib/creatorData.js`), made-up jobs and numbers
      with nothing read from the database. The made-up driver's menu has no Jobs row
      until the switch is on; `/jobs` itself still opens.

## Verifying

- [x] Lint on every changed file, and a production compile of a scratch copy, 2026-11-14
- [x] In Node, 2026-11-14: the gate for 13 kinds of account and switch; the serializer
      sends exactly its six fields, never a name from the `driver` cell or from a
      Seniority cell that isn't a number; sorting with blanks last; the made-up jobs have
      the serializer's shape and build a schedule with linked stops
- [x] The board and a schedule rendered on the server from the made-up jobs (scratch
      copy, 2026-11-14), and `/jobs` signed out goes to sign-in
- [ ] As an admin, on a phone and a wide screen, light and dark: the Jobs row, the cards
      and the table, search, each sort, a job's details and a stop's link to its SLIC
- [ ] As a verified admin: "Your job" is on your own job only
- [ ] Creator mode on: `/jobs` shows the OAK jobs, no real job code or number

**Rollout checklist, before turning the switch on:**

- [ ] Decide on the seniority number (Ground rules), and say what the page shows on
      `/privacy` (the Covers section says what drivers see of each other)
- [ ] A `/help` guide with `feature: 'jobsOpen'` (`help/guides.jsx`), if drivers need one
- [ ] Check the Seniority column on `/admin/jobs` holds only numbers
- [ ] Turn it on; turning it off is the rollback
