# SLIC-DIRECTIONS.md

Plan and checklist for turning the directions PDFs into routes drivers read in the app,
suggest changes to, and print, plus extra documents such as a railyard map. Built in
stages; check items off as they ship.

**How to use this:** stages go in order, and each one ships on its own with a fallback.
Each item says where the code lives. Run `npm run build` (in a scratch copy, never while
`next dev` runs) before shipping any item. The app is used daily in production.

## Status (2026-11-12)

- **Stage 0 done 2026-11-12:** `ROUTE-REVIEW.md`. Its "Do first" list (a gate code in a
  public PDF, low clearances, a parkway, Manhattan streets) and its 28 app-vs-PDF
  mismatches are Tiago's to confirm with drivers.
- **Stage 1 is live (2026-11-12):** deployed, `db:indexes` run, and all 65 routes imported
  on production (Tiago ran `routes:import`). NWTVA's gate code was taken out of its route
  on the edit page; its earlier version and the import's history line still hold it
  (staff-only). Left: an admin goes over each of the other 64 on its edit page with
  `ROUTE-REVIEW.md` open (saving makes it "Driver-approved"), and Read aloud and Step by
  step get tried on a real phone.
- **Stage 2 is live (2026-11-12):** drivers suggest, the SLICs area approves or declines on
  `/admin/routes`, and the sheet opens on a safety note. Deployed, `db:indexes` run. Left:
  one real suggestion filed and decided on the live site.
- **Stage 3 is built (2026-11-12)** and checked on the dev copy: photos and PDFs such as a
  railyard map on the edit page, in the directions sheet and on the print page. Left:
  deploy, `npm run db:indexes`, and the first real railyard map.

---

## Why

The ask, from `TODOS.md` → Inbox (2026-11-12):

> **Revamp the pdf directions**: Maybe add the ability to create a pdf for a slic. Check the
> current pdfs using Claude and see if Claude can recommend improvements or optimizations.
> These driver approved routes have to be truck-friendly. Also, I would like to add the
> ability to add other pdfs such as a map of the railyard (this is an actual thing we can
> have).

What's there today:

- **65 PDFs,** all for UPS centers, all on Vercel Blob (`slics.pdfUrl`; the legacy
  `pdf: true` is still set on each). They're one-page Word exports: a header copying the
  SLIC record (alpha, number, name, address, phone), then one paragraph of directions from
  BETPA ("33 south to 78 east…").
  - The header goes stale when an address or phone changes in the app.
  - A paragraph is hard to follow in a cab.
  - The files are public URLs (`SECURITY.md` #13).
- **Drivers** tap the PDF tile on the card, which opens the file in a new tab
  (`home/SlicActions.jsx`, `slicPdfHref` in `constants.js`).
- **Admins** upload or replace it on the edit page (`slicForm/PdfUpload.jsx`,
  `POST`/`DELETE /api/slics/[id]/pdf`, `lib/blob.js`, 4 MB).
- **Nothing makes a PDF:** there's no PDF or map library, and the CSP blocks
  `frame-src`/`object-src`, so a PDF can't be shown inside a page.
- **`slics.directions`** is in the edit route's allow-list but empty on every SLIC and
  shown nowhere.

Decided 2026-11-12:

- **Directions become text in the app,** shown on the card as steps, with a print / save as
  PDF on demand. The 65 are converted once and the original PDFs kept.
- **Drivers suggest, admins approve.** A route shows who approved it and when.
- **Extra documents are photos or PDFs,** with a title ("Railyard map").
- **Claude's review is a report Tiago checks.** No route changes without him.

## Ground rules

- **A route is the hub's; a document is the destination's** (`MULTI-HUB.md` → Shared
  SLICs). A route is the way from one building, so it's stored per hub (`hubId: 'betpa'`
  for now). A railyard map is the same for everyone, so it's shared.
- **Plain text only.** Routes and suggestions are never rendered as HTML (`SECURITY.md`
  #2), like Driver tips.
- **Nothing is lost.** The PDFs stay in Blob and on the SLIC until a later, separate step
  retires them. Every route keeps its earlier versions. The import has `--dry-run`,
  `--dev` and `--undo`, and runs on the dev copy before production.
- **A SLIC with no route keeps its PDF tile,** so drivers never lose directions mid-way.
- **Truck-friendly is a driver's call.** Claude flags what to check; an admin approves a
  route, and the card says "Driver-approved route" with the date. `MAP_ROUTE_NOTE` stays
  beside it.

## Stage 0 — Claude's review of the 65 routes (no code)

- [x] Read every PDF (read-only, from `pdfUrl`) and write `ROUTE-REVIEW.md`, one section
      per SLIC. Each finding says "confirm with a driver"; nothing about roads is claimed
      as checked. It looks for:
  - the PDF's header disagreeing with the app's record (address, phone, name);
  - outdated exit numbers and landmarks that may be gone;
  - steps that don't reach the address, or contradict each other;
  - roads that may not allow trucks: parkways, low clearances, local truck bans;
  - where the paragraph would read better as steps.
- The report is stage 1's checklist for the import.

**Done 2026-11-12.** All 65 have a text layer (no scans). Findings: a gate pass code in
NWTVA's public PDF, four routes that rely on fitting under a low clearance, a parkway on
BRUNY's way back, Manhattan street legs to check against the city's truck routes, a
possible I-481/I-81 renumbering on SYRNY, and 28 SLICs whose PDF and app record
disagree (address, city or zip, phone). Three things change stage 1 (below): 24 routes
have more than one section, many end with arrival notes that belong to the destination,
and a code must never be in route text.

## Stage 1 — Routes as text on the card

- [x] **`slic-routes`** (per hub), one doc per `(hubId, numSlic)`, unique in
      `lib/db/indexSpecs.mjs`:
      `{ hubId, numSlic, text, source: 'pdf-import' | 'admin' | 'suggestion', importedFrom,
approvedBy { id, name }, approvedAt, updated_at, previous: [{ text, approvedBy,
approvedAt }] }`. `text` is one step per line; `previous` keeps the last 20.
  - **Sections** (from the review): a line ending in `:` ("Way 2 (easier):", "Way back:",
    "From Burtonsville, MD:") starts a section, and the sheet numbers each section's steps
    on their own. 24 of the 65 need it.
- [x] **Arrival notes** (from the review): gates, doors, check-in, weekend rules and
      railyard steps are the destination's, the same from any hub, so they're a shared
      plain-text field on the SLIC, `slics.arrival`, edited on the edit page and shown in
      the sheet under "Getting in". Never a gate code: the editor warns on a run of digits
      after "code", and `ROUTE-REVIEW.md` → Do first covers NWTVA's.
  - `lib/db/slicRoutes.js`: `getRoute`, `getRouteNumSlics`, `saveRoute` (moves the old
    text into `previous`), `restoreRoute`, `deleteRoute`. Every write stamps
    `hubId: DEFAULT_HUB_ID`, and the collection joins `PER_HUB_COLLECTIONS` in
    `scripts/backfillHubId.mjs`.
  - A save is in `slic_history` as `{ field: 'route', from, to }` (`addSlicHistoryEntry`),
    so the edit page's history shows it. Restore and delete go to `admin_audit` first.
- [x] **Import:** `scripts/importSlicRoutes.mjs` (`npm run routes:import`, `--dry-run`,
      `--dev`, `--undo`).
  - It downloads each `pdfUrl`, extracts its text (`unpdf`, a dev dependency used only by
    the script), and drops the header lines that match the SLIC's own record.
  - It saves the text unchanged as `source: 'pdf-import'`, with `importedFrom`, reading it
    as UTF-8 so ½, ¾ and accents survive. Splitting it into steps, sections and arrival
    notes is done by hand on the edit page, SLIC by SLIC, with `ROUTE-REVIEW.md` open.
  - The dry run lists each SLIC: header matched or not, characters, and any PDF with no
    text layer (a scan, to type by hand).
  - `--undo` deletes only imported routes nobody has edited since. `pdfUrl` and the PDFs
    are untouched.
- [x] **Driver view:**
  - The route comes from `GET /api/slics/[numSlic]/route` (`requireUser`), since a lookup
    on `/home` doesn't go back to the server (`lib/lookupUrl.js`). `toDriverSlic` is
    unchanged.
  - In the card's Call / PDF / Tips row, a **Directions** tile replaces the PDF tile when a
    route exists (`home/SlicActions.jsx`).
  - It opens a soft sheet (full screen on a phone, a dialog on desktop) with:
    - the steps, numbered and large (a single paragraph shows as one);
    - each section numbered on its own, alternative ways as tabs, "Getting in" last;
    - **Step by step** (one step per screen, big Next/Back, the screen kept on) and **Read
      aloud** (`speechSynthesis`), as answered below;
    - "Driver-approved route · approved <date>" and `MAP_ROUTE_NOTE`;
    - **Print / save PDF**, which opens `/slics/<numSlic>/print`: a print-styled page with
      the live record's header, the steps and the route's date. `window.print()` gives
      "Save as PDF" on phones and desktops, with no PDF library and no CSP change;
    - **Original PDF** while one exists;
    - **Suggest a change** (stage 2).

  - **Long routes and hands-free** (Tiago's question, answered 2026-11-12):

    > How do we handle a long winded route that doesn't fit well on a single screen or
    > page? It is currently displayed as a single paragraph, which may require scrolling.
    > Should we consider breaking it into multiple pages or adding a collapsible section
    > for better readability? We want to be hands free and minimize driver distraction, so
    > readability and ease of access are key considerations. Maybe voice commands to
    > navigate through the steps could help. Is that possible on a web app like this?
    - **Steps and sections, not pages.** The scrolling comes from the paragraph, which
      the steps and sections above fix: a long route like FOSNY or 1110 becomes 10–15
      short numbered lines per section. Paging back and forth is more fiddly than a clean
      list, so no pages.
    - **Alternative ways are tabs** ("Way 1 / Way 2 / Way back"), one shown at a time, the
      last one chosen remembered per SLIC (`localStorage`). They're choices, not one long
      read. "Getting in" (`slics.arrival`) is its own section at the end.
    - **A step-by-step view:** one step fills the screen in very large text, with Next and
      Back as big tap areas a thumb finds without looking. The screen stays on while it's
      open (the Screen Wake Lock API, Safari 16.4+ and Chrome; the Permissions-Policy in
      `next.config.mjs` doesn't block it).
    - **Read aloud:** one button speaks the current step through the browser's own
      text-to-speech (`speechSynthesis`, on iPhone and Android, no server, no microphone),
      then waits for Next. It stops when the driver switches to the maps app, because the
      browser pauses the page, so it's for before pulling out or at a stop.
    - **Voice commands** ("next", "repeat") are possible but not dependable: speech
      recognition is best in Chrome on Android (it sends audio to Google), patchier in
      Safari, stops after silence, needs the page in front and a network, and struggles
      with cab noise. The Permissions-Policy also has `microphone=()`. Left for later, as
      an Android-only experiment ([Later](#later)).
    - **The real hands-free answer is stage 4:** the approved route goes into the maps app
      as waypoints, so the app's own voice guidance follows it.
    - **Distraction:** the design assumes a route is read before rolling or while stopped,
      and the maps app does the talking on the road. Check UPS's rules on phone use in the
      cab before any in-cab feature is promoted to drivers.

- [x] **Admin:** a Route section on `/admin/edit/<slic>` beside `PdfUpload`
      (`slicForm/RouteEditor.jsx`).
  - It has a soft multiline field (one step per line), Save, Original PDF to compare
    against, and earlier versions with Restore.
  - Saving sets `approvedBy` / `approvedAt` and sends `notifySlicEdit` with a new
    `SLIC_ACTIONS.route` ("Route updated").
  - Area `slics`.
- [x] **Copy, changed together:**
  - `/help`: "Open the directions PDF" becomes "Read the directions" (`help/guides.jsx`,
    `ExampleSlicCard.jsx`, `HelpScreens.jsx`);
  - the landing page (`landing/ProductPreview.jsx`, `Features.jsx`);
  - `PRODUCT.md`, `DATA-MODEL.md`, `OPERATIONS.md`, `CLAUDE.md`.
- **Rollback:** `npm run routes:import -- --undo` (or deleting a route) brings the PDF tile
  back for that SLIC.

**Done 2026-11-12, with these differences from the plan:**

- **Paths:** the API is `/api/slic-routes?slic=<numSlic>` (`/api/slics/[id]` means the
  `_id`), and the print page is `/directions/<numSlic>`.
- **No restore action:** an earlier version goes back into the box ("Put in the box") and
  is saved like any edit, so `slic_history` is the record; no `admin_audit` rows for routes
  except the import's counts (`routes.imported` / `.importUndone`). `getRouteNumSlics`,
  `saveRoute` and `deleteRoute` are the data layer; there's no `restoreRoute`.
- **The import puts one sentence per step** (the words unchanged), instead of leaving the
  paragraph for an admin to split: a paragraph as one step made Step by step useless. It
  keeps `...` inside brackets in one step, splits after a road abbreviation only before a
  usual step opener, and turns way titles without a colon ("George Washington Bridge
  Way") into sections. Arrival notes stay in the route text until an admin moves them.
- **Where the card learns about a route:** the lookup page reads every routed numSlic once
  (`getRouteNumSlics`) into `toDriverSlic`'s `hasRoute`; `slics.arrival` rides on the SLIC.
- **History** shows "Route added / changed / removed", not the text, which is long.
- **Checked on the dev copy:** dry run on production (all 65, every header dropped); import,
  undo and import again; phone screenshots, light and dark, of the card, the sheet with
  four ways, Step by step, Getting in, the editor and its earlier version; Chrome's
  printout (white, no shadows, a heading kept with its step); an admin save (200), an empty
  one (400), long arrival notes (400), a driver's save (403); the driver's route has no
  `approvedBy`. Read aloud and the wake lock need a real phone (Verifying).

## Stage 2 — Drivers suggest, admins approve

- [x] **`route-suggestions`** (per hub): `{ hubId, numSlic, userId, text, note, status:
'open' | 'approved' | 'declined', decidedBy, decidedAt, answer, created_at }`,
      modeled on `slic-reports` (`lib/db/slicReports.js`).
- [x] **Filing:**
  - "Suggest a change" in the Directions sheet, or "Add directions" on a SLIC with none,
    opens a soft form prefilled with the current steps, plus a note ("why it's better or
    truck-safe").
  - `POST /api/route-suggestions` (`requireUser`), rate-limited per driver
    (`lib/rateLimit.js`), plain text with a length cap. One open suggestion per driver per
    SLIC.
- [x] **The queue,** `/admin/routes` (area `slics`; a `PAGE_TITLES` entry and a row on
      `/admin`), shows the current route next to the suggestion.
  - **Approve** (after an optional edit) saves through `saveRoute` with
    `source: 'suggestion'`.
  - **Decline** takes an optional answer the driver sees.
  - **Delete** writes `admin_audit` first.
- [x] **Alerts:**
  - a banner on `/admin` and the header-menu badge through `GET /api/admin-alerts`, like
    `slicReports/SlicReportsNotice.jsx` and `lib/slicReportsStore.js`;
  - an admin push kind, `routeSuggestions` (`PUSH_TYPES`, area `slics`, on by default like
    SLIC reports), lock-screen safe: "SLIC 1813: a route suggestion".
- [x] **Account deletion** unlinks a driver's suggestions (`userId` → null), like
      `unlinkUserSlicReports`.
- [x] **Add Notifications** above the directions let's add a collapsible or closeable section
      for an alert, showing that the step by step will keep the phone awake, and caution not to use
      a device while driving!

**Done 2026-11-12, with these differences from the plan:**

- **Area `slics`**, not `reports`: approving edits a route. So dispatch (SLICs by default)
  gets the queue, banner, badge and push too; `ALERT_AREAS` in `header/UserMenu.jsx` gained
  `slics`. The tool link is a second link under SLICs in `STAFF_AREAS`.
- **The push** says "Route suggestion for SLIC 1809" ("A driver suggested directions."),
  the SLIC only. Sending again (it replaces the open one) sends nothing.
- **The driver sees the outcome** in the same form: waiting, approved, or declined with the
  admin's answer (`GET /api/route-suggestions?slic=`, their own only). No push to drivers.
- **"Add directions"** is a quiet link under a card with no route and no arrival notes
  (`home/AddDirections.jsx`); a SLIC with arrival notes only has it in the sheet.
- **The safety note** (Tiago's item): the sheet opens on "Don't use your phone while
  driving. Read the steps before you pull out, or while you're stopped. While the
  directions are open, your screen stays on." Closing folds it to a "Driving safety"
  button, remembered per device (`directions/DrivingNotice.jsx`); Step by step says
  "Screen stays on · Don't use your phone while driving" under the step.
- **The sheet pins** only Step by step, Read aloud and Print; Original PDF and Suggest a
  change sit at the end of the content, so the steps keep most of the screen.
- **Also:** the privacy policy (effective November 12, 2026) says what's kept and that an
  approved route never names its driver; /help's directions guide mentions suggesting.
- **Checked on the dev copy:** as the `+driver` account, filing one (200), sending again
  (`updated: true`), an empty one (400), an admin action (403); as the admin, the banner
  (2), the queue beside the current route, Approve and publish (the route became the
  suggestion with `source: 'suggestion'`, "Driver-approved"), Decline with an answer (the
  driver sees it), Delete (`routeSuggestion.deleted` in `admin_audit` with SLIC, status and
  date only), and the count back to 0.

## Stage 3 — Extra documents (railyard maps and more)

- [x] **`slic-documents`** (shared): `{ numSlic, title, kind: 'image' | 'pdf', url, width,
height, bytes, sortOrder, uploadedBy, created_at }`.
- [x] **Storage:** `lib/blob.js` gains `putSlicDocument` / `deleteSlicDocument`
      (`slic-docs/<alpha>-…`, a random suffix, the old blob deleted after the save).
- [x] **Routes:** `POST /api/slics/[id]/documents` and `PATCH`/`DELETE
…/documents/[docId]` (area `slics`).
  - The server checks the content (`%PDF-`, JPEG/PNG/WebP signatures), not only the name.
  - A phone photo is resized in the browser (canvas, longest side 2400 px, JPEG) to stay
    under the 4 MB request limit.
  - Each change is in `slic_history` (`{ field: 'document', … }`) and sends
    `notifySlicEdit`.
- [x] **Admin:** a Documents section on the edit page (`slicForm/SlicDocuments.jsx`): add
      with a title, rename, reorder, remove.
- [x] **Driver:**
  - documents are listed in the Directions sheet, or behind a "Maps & docs" tile when
    there's no route;
  - images show inline (`img-src` already allows the Blob host) and open full screen to
    zoom;
  - PDFs open in a new tab.
- **Privacy:** like today's PDFs, the files are public URLs. `SECURITY.md` #13's fix (a
  signed-in route that streams them) covers both.

**Done 2026-11-12, with these differences from the plan:**

- **Limits:** 12 documents per SLIC, 4 MB per upload, titles up to 60 characters. A photo
  that already fits (2400 px, 4 MB, JPEG/PNG/WebP) goes up as it is, so a crisp PNG
  screenshot of a map stays crisp; anything bigger is redrawn as a JPEG. A photo the
  browser can't read (HEIC on a desktop) is refused before upload.
- **Driver reads** go through `GET /api/slics/[id]/documents` (`requireUser`), loaded with
  the route when the sheet opens; `hasDocuments` comes from one `getDocumentNumSlics()` per
  lookup page. A SLIC with only documents gets a "Maps & docs" tile; "Add directions" under
  the card hides for it (the sheet has it).
- **The print page** prints the photos full width and lists the PDFs.
- **A failed save takes the file back down** (the blob is deleted if the row can't be
  written).
- **Checked on the dev copy** (the uploads went to the real Blob store and were deleted
  through the app; both URLs answer 404): a 1600×1000 PNG and a PDF uploaded with titles;
  a text file named `.png` refused in the browser and by the server (400, "That isn't a
  photo… or a PDF"), an empty title refused; the sheet's Maps & documents, the full-screen
  photo, the printout; rename, move up, remove; history lines "Document added / renamed /
  removed".

## Stage 4 — The approved route in the maps app

Drivers already navigate by voice in Google Maps, which picks its own route, not always a
truck-friendly one (`MAP_ROUTE_NOTE`). Google's Maps URLs take `waypoints`, so the app can
send the approved route's main legs and let Maps' turn-by-turn voice follow BETPA's way,
hands-free.

- [ ] **Waypoints on a route:** `slic-routes` gains `waypoints: [{ label, lat, lng }]`, 2–5
      points that pin the main legs ("Mario Cuomo Bridge", "I-84 at exit 20"). They're
      set on the edit page with the pin field (`form/PinField.jsx`, a pasted Google Maps
      link or coordinates), and are part of the route, so they're versioned and approved
      with it.
- [ ] **"Open route in Maps"** in the Directions sheet, and on the card's map button when
      a route has waypoints: a Google Maps directions URL (`api=1`, `destination` = the
      address, `waypoints` = the points, `travelmode=driving`), built in `lib/geo.js`
      beside `mapsHref`.
  - Apple Maps links don't take waypoints, so on an iPhone this opens Google Maps (in
    the app if installed, else the browser). The plain "Open map" keeps the driver's own
    choice (`useMapsApp`).
  - Waypoints fix the main legs only. The last mile and "Getting in" still matter, so the
    sheet says so beside the button.
- [ ] **Check:** open each route's link on a phone, and confirm with a driver that Maps
      follows the approved roads between the points.

## Later

- **Voice commands** ("next", "repeat"), Android-only and experimental: the Web Speech
  API's recognition, behind a switch, with `microphone=(self)` in the Permissions-Policy.
  Only if Read aloud and stage 4 leave a real need.
- Retire the PDF tile once every imported route is checked. Retiring the Supabase bucket
  stays its own item (`TODOS.md` → Housekeeping).
- Take the unused `slics.directions` out of the edit route's allow-list.

## Verifying

- **Stage 0:** the report covers all 65, and each header-vs-record mismatch it names is
  confirmed against the record.
- **Stage 1:**
  - `routes:import -- --dev --dry-run`, then `--dev`, on the dev copy; `--undo` brings the
    PDF tiles back; import again.
  - The production dry run comes before any production write, with Tiago's go-ahead.
  - Lint and build.
  - Headless phone screenshots, light and dark, signed in with the dev test accounts: the
    card with Directions and with the PDF fallback, the sheet, the print page, the editor.
  - Chrome's `Page.printToPDF` on the print page.
  - On a real iPhone and an Android phone: Step by step keeps the screen on, Read aloud
    speaks a step and stops cleanly when the app goes to the background, and the tabs
    remember the last way chosen.
- **Stage 2:**
  - On the dev copy: file a suggestion as the `+driver` test account, then approve one and
    decline one as the admin.
  - The route, its `previous`, `slic_history`, the banner, the badge and `push-log` all
    update.
  - Too many suggestions, or one too long, is answered with 429 or 400 and `{ error }`.
- **Stage 3:**
  - Upload a photo over 4 MB from a phone-sized browser (it's resized) and a PDF; a
    renamed non-image is refused.
  - The image shows inline under the CSP.
  - Removing a document deletes its blob.
- **Stage 4:** each route's "Open route in Maps" link opens Google Maps with every
  waypoint in order, on an iPhone and an Android phone, and a driver confirms Maps keeps
  to the approved roads between them.
