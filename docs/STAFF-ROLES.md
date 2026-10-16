# STAFF-ROLES.md

Plan and checklist for staff roles: a **Dispatch** role beside Admin, and a switch per
admin tool per role on `/admin/super/admins`. Built in one go on 2026-10-16, in five
commits that can each be reverted alone.

**How to use this:** the decisions below were made with Tiago on 2026-10-16. Run
`npm run build` (in a scratch copy, never while `next dev` runs) before shipping. The app
is used daily in production.

## Status (2026-10-16)

**Built 2026-10-16; waiting on deploy and the live checks in "Verifying".** No index or
migration: the only new data is an `app-settings` document that doesn't exist until the
first switch is flipped, and `users.role` can now say `dispatch`. Until someone is made
a dispatcher or a switch is flipped, nothing changes for anyone: admins have every tool
by default.

**Rolling back:**

| To undo | How |
|---|---|
| A stage | `git revert` its commit ("Staff roles, part 1" to "part 8", plus the part 4 follow-up; part 6 is the docs) |
| Saved switches | Delete the `app-settings` document `{ _id: 'roles' }`; the defaults come back |
| A dispatcher's access | Set their role to User on `/admin/super/admins` (or `/admin/users`) |

Reverting part 1 needs every later part reverted first, and part 2 needs part 7 reverted
first (it brings back `getAdminSession`). A dispatcher's row left behind
by a full revert is harmless: every gate then checks `role === 'admin'` again, so
`dispatch` is a driver.

---

## Why

Tiago's ask, 2026-10-16:

> I would like to add a role (Dispatch), similar privileges to admin. I would like the
> Dispatch role to be able to access a menu to Dispatch and superAdmins. The menu will
> allow them access to the SLICs page where they can add, edit, or delete SLICs. I want
> Dispatch to just be able to access SLICs. As a matter of fact, I would like (in
> /admin/super/admins) I would like the ability to choose which services each member is
> able to use (Covers, SLICs, Jobs, etc...) Is it easier to allow features to each group
> or each individual? With toggles to show which ones are permitted to each role or user.

Decided:

- **Per role, not per person.** The switches belong to a role, and everyone with the role
  gets its tools. A new dispatcher needs only the role picked, one switch changes everyone
  in it, and who can do what is one table. Per-person exceptions can be added later (see
  "Follow-ups").
- **Dispatch has its own page, `/dispatch`,** in the header menu for dispatchers and super
  admins (for a super admin it's a preview). It lists the Dispatch role's tools. The tools
  themselves are the existing admin pages (`/admin/slics`, `/admin/new`, `/admin/edit/…`),
  not copies.

## Ground rules

- **An admin tool is an area.** `STAFF_AREAS` in `constants.js` lists them, in the order
  the hubs show them. Every admin page checks its area with `getAreaSession('<area>')` and
  shows `admin/NoAccess.jsx` without it; every admin route checks it with
  `requireArea('<area>')` (`lib/authz.js`). Never a role literal. A new admin page or route
  belongs to an area, or to a new one added to `STAFF_AREAS`.
- **Super admins always have every area,** whatever is saved, and nothing on the page can
  switch that off (`areasFor`, `lib/staffAreas.js`). Super-admin pages and role changes
  aren't areas: they stay `requireSuperAdmin()`.
- **Only overrides are saved.** `app-settings` `{ _id: 'roles' }` holds what the super
  admin switched (`{ admin: { jobs: false }, dispatch: { reports: true } }`); anything
  missing is `ROLE_AREA_DEFAULTS` (Admin: every area; Dispatch: SLICs). So an area added to
  the code later starts at its default.
- **Fresh like the role.** `auth.js` puts the account's areas on every session
  (`session.user.areas`), read through a 5-minute shared cache that a switch drops
  (`revalidateTag`), so a change reaches staff on their next request.
- **Dispatch is a driver everywhere else.** Every check that wasn't moved to an area still
  says `role === 'admin'`, so a dispatcher has no notifications (`canUsePush`), can delete
  their own account like a driver, and gets no other admin power.
- **Every change is audited first:** `role.changed` (`lib/db/admins.js`) and
  `roleArea.changed` (`lib/db/appSettings.js`) in `admin_audit`.

## The areas

| Key | Label | Pages | Also |
|---|---|---|---|
| `slics` | SLICs | `/admin/slics`, `/admin/new`, `/admin/edit/[slic]` | `/api/slics` POST, `[id]` PATCH/DELETE, `[id]/pdf`; the SLIC edits push |
| `reports` | SLIC reports | `/admin/reports` | `/api/slic-reports` GET, `[id]`; `?report=` on the edit page; the banner and badge count; the reports push |
| `driverClaims` | Driver claims | `/admin/driver-claims` | `/api/driver-claims` GET, `[id]`; `/api/cover-disputes` GET, `[id]`; `/api/users/[id]/driver`; banner, badge, both pushes |
| `comments` | Comments | `/admin/comments` | Edit or delete anyone's tip, place or place comment; see a tip's voters; the tips and places pushes |
| `users` | Users | `/admin/users`, `/admin/users/[id]` | `toggle-member`, `password-reset`, anyone's phone (`add-phone`); the sign-ups push |
| `jobs` | Jobs | `/admin/jobs` | `/api/sheet-jobs/*`; banner, badge, the job changes push |
| `covers` | Covers | `/admin/cover/drivers`, `/jobs`, `/lists` | `/api/cover-bid-jobs/*`, `/api/cover-job-changes/*`, `GET /api/cover-preferences`; `/covers` before it opens (`canUseCovers`); banner, badge, the cover pushes |
| `drivers` | Drivers | `/admin/drivers` | `/api/drivers/*` |
| `gyms` | Planet Fitness | `/admin/planet-fitness` | `/api/gyms/*`, `/api/gym-comments/*` |

## Stages

### Part 1: areas exist (no visible change)

- [x] `STAFF_ROLES`, `ROLE_LABELS`, `STAFF_AREAS`, `STAFF_AREA_KEYS`,
      `ROLE_AREA_DEFAULTS` in `constants.js`.
- [x] `lib/staffAreas.js`: `areasFor`, `userHasArea` (the client's `hasArea`),
      `areaLabel`, `areaEntries`.
- [x] `lib/db/appSettings.js`: `getRoleAreas` (cached), `getRoleAreasFresh`,
      `validateRoleArea`, `setRoleArea`.
- [x] `auth.js` sets `token.areas` / `session.user.areas`; `auth.config.js` and
      `layout/SessionSync.jsx` carry it.
- [x] `lib/authz.js`: `hasArea`, `areasOf`, `isStaff`, `getAreaSession`, `requireArea`,
      `requireStaff`. (`getAdminSession`, unused after part 2, was removed in part 7.)

### Part 2: every admin gate checks its area (no change for admins)

- [x] The 34 admin routes call `requireArea`; the admin pages `getAreaSession`, with
      `admin/NoAccess.jsx`.
- [x] `app/admin/layout.jsx` lets in any staff account (`isStaff`).
- [x] `/admin/cover/jobs` gets a server gate (its client body moved to
      `coverBidJobs/CoverJobsPage.jsx`).
- [x] The `/admin` index is built from the viewer's areas by `admin/StaffHub.jsx`;
      `GET /api/admin-alerts` answers any staff account, 0 outside their areas.
- [x] Moderation (tips, places, place comments, voters) checks `comments`; anyone's phone
      checks `users`; Covers early access checks `covers`; a dispatch account's reset
      link is super-admin-only like an admin's.

### Part 3: the Dispatch role and `/dispatch`

- [x] `setUserRole` replaces `setAdminRole`; `POST /api/admins` takes a role, new
      `PATCH /api/admins/[id]`, `toggle-role` takes `{ role }` (a bodyless toggle never
      promotes a dispatcher).
- [x] `/dispatch` (`app/dispatch/page.jsx`) and the Dispatch row in the header menu;
      alerts and the badge for any staff account with a tool that has alerts (Jobs,
      Covers, SLIC reports, Driver claims; part 8), so SLICs alone makes no call.
- [x] SLIC pages for a dispatcher: `?report=` only with SLIC reports; editors by name only
      (`withNamedStamps`, `withNamedUser` in `lib/serializers.js`); the PATCH route keeps
      only the form's seven fields.
- [x] A SLIC delete writes a `deleted` history entry with every field it removed
      (`SECURITY.md` #17); the SLIC push says "By dispatch." for a dispatcher's change.

### Part 4: the switches on `/admin/super/admins`

- [x] "What each role can use" (`super/RoleAreas.jsx`) through `PATCH /api/role-areas`.
- [x] Admins and Dispatch listed apart; Make admin / Move to Dispatch / Remove; "Add
      someone" with a role.
- [x] `/admin/users`: a Change menu (User, Dispatch, Admin); "Staff only" filter.

### Part 5: admin notifications follow the tools

- [x] Each admin kind in `PUSH_TYPES` names its `area`; `getPushAudience` sends it to
      admins only while the Admin role has that tool (super admins always);
      `pushTypesFor` offers it only with the tool (`/profile`, push-prefs, the
      Notifications overview).

## Verifying

Done before shipping (2026-10-16):

- [x] `npm run lint`, and `next build` in a scratch copy.
- [x] Read-only against production with jiti: no `roles` document yet, so Admin has all
      nine areas and Dispatch SLICs; `areasFor` right for user, admin, dispatch and super
      admin; `getAdminOverview` and `getAdminCounts` with the new queries.
- [x] Signed out, on a scratch `next start`: 23 changed routes answer 401, including the
      legacy aliases; `/dispatch`, `/admin/slics` and `/admin/cover/jobs` redirect to
      sign-in.
- [x] Phone-width screenshots, light and dark, of the Admins page, `/dispatch` and the
      no-access message (scratch-only preview pages with made-up staff).

After deploying (there's no dev copy wired up yet, `DEV-DATABASE.md`):

- [ ] Signed in as Tiago: every admin tool still on `/admin`; the Admins page shows the
      switches, all on for Admin and SLICs for Dispatch.
- [ ] Make `claude-test@slics.app` Dispatch. Signed in as it: the menu shows Dispatch, not
      Admin; `/dispatch` lists SLICs; `/admin/slics` and the add form open; `/admin/jobs`
      shows "No access"; `GET /api/sheet-jobs/changes` answers 403;
      `/api/admin-alerts` is all zeros. Don't save a test SLIC (drivers see it). Then set
      it back to User.
- [ ] A driver's menu and `/home` are unchanged.

## Follow-ups

- Notifications for dispatchers: `canUsePush` and the admin kinds are still
  `role === 'admin'`. Letting a dispatcher with SLIC reports get the reports push means
  opening `canUsePush` to staff and querying `getPushAudience` by role areas.
- Per-person exceptions, if one dispatcher ever needs a tool the others don't.
- Account deletion is still refused only to admins (`DELETE /api/users/[id]`); decide
  whether a dispatcher should need a super admin to leave too.
