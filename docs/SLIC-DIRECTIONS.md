# SLIC-DIRECTIONS.md

Plan and checklist for turning the directions PDFs into routes drivers read in the app,
suggest changes to, and print, plus extra documents such as a railyard map. Built in
stages; check items off as they ship.

**How to use this:** stages go in order, and each one ships on its own with a fallback.
Each item says where the code lives. Run `npm run build` (in a scratch copy, never while
`next dev` runs) before shipping any item. The app is used daily in production.

## Status (2026-11-12)

- **Planned 2026-11-12.** Stage 0 (Claude's review of the existing routes) is next; no code
  is written yet.

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

- [ ] Read every PDF (read-only, from `pdfUrl`) and write `ROUTE-REVIEW.md`, one section
      per SLIC. Each finding says "confirm with a driver"; nothing about roads is claimed
      as checked. It looks for:
  - the PDF's header disagreeing with the app's record (address, phone, name);
  - outdated exit numbers and landmarks that may be gone;
  - steps that don't reach the address, or contradict each other;
  - roads that may not allow trucks: parkways, low clearances, local truck bans;
  - where the paragraph would read better as steps.
- The report is stage 1's checklist for the import.

## Stage 1 — Routes as text on the card

- [ ] **`slic-routes`** (per hub), one doc per `(hubId, numSlic)`, unique in
      `lib/db/indexSpecs.mjs`:
      `{ hubId, numSlic, text, source: 'pdf-import' | 'admin' | 'suggestion', importedFrom,
      approvedBy { id, name }, approvedAt, updated_at, previous: [{ text, approvedBy,
      approvedAt }] }`. `text` is one step per line; `previous` keeps the last 20.
  - `lib/db/slicRoutes.js`: `getRoute`, `getRouteNumSlics`, `saveRoute` (moves the old
    text into `previous`), `restoreRoute`, `deleteRoute`. Every write stamps
    `hubId: DEFAULT_HUB_ID`, and the collection joins `PER_HUB_COLLECTIONS` in
    `scripts/backfillHubId.mjs`.
  - A save is in `slic_history` as `{ field: 'route', from, to }` (`addSlicHistoryEntry`),
    so the edit page's history shows it. Restore and delete go to `admin_audit` first.
- [ ] **Import:** `scripts/importSlicRoutes.mjs` (`npm run routes:import`, `--dry-run`,
      `--dev`, `--undo`).
  - It downloads each `pdfUrl`, extracts its text (`unpdf`, a dev dependency used only by
    the script), and drops the header lines that match the SLIC's own record.
  - It saves the paragraph unchanged as `source: 'pdf-import'`, with `importedFrom`.
  - The dry run lists each SLIC: header matched or not, characters, and any PDF with no
    text layer (a scan, to type by hand).
  - `--undo` deletes only imported routes nobody has edited since. `pdfUrl` and the PDFs
    are untouched.
- [ ] **Driver view:**
  - The route comes from `GET /api/slics/[numSlic]/route` (`requireUser`), since a lookup
    on `/home` doesn't go back to the server (`lib/lookupUrl.js`). `toDriverSlic` is
    unchanged.
  - In the card's Call / PDF / Tips row, a **Directions** tile replaces the PDF tile when a
    route exists (`home/SlicActions.jsx`).
  - It opens a soft sheet (full screen on a phone, a dialog on desktop) with:
    - the steps, numbered and large (a single paragraph shows as one);
    - "Driver-approved route · approved <date>" and `MAP_ROUTE_NOTE`;
    - **Print / save PDF**, which opens `/slics/<numSlic>/print`: a print-styled page with
      the live record's header, the steps and the route's date. `window.print()` gives
      "Save as PDF" on phones and desktops, with no PDF library and no CSP change;
    - **Original PDF** while one exists;
    - **Suggest a change** (stage 2).
- [ ] **Admin:** a Route section on `/admin/edit/<slic>` beside `PdfUpload`
      (`slicForm/RouteEditor.jsx`).
  - It has a soft multiline field (one step per line), Save, Original PDF to compare
    against, and earlier versions with Restore.
  - Saving sets `approvedBy` / `approvedAt` and sends `notifySlicEdit` with a new
    `SLIC_ACTIONS.route` ("Route updated").
  - Area `slics`.
- [ ] **Copy, changed together:**
  - `/help`: "Open the directions PDF" becomes "Read the directions" (`help/guides.jsx`,
    `ExampleSlicCard.jsx`, `HelpScreens.jsx`);
  - the landing page (`landing/ProductPreview.jsx`, `Features.jsx`);
  - `PRODUCT.md`, `DATA-MODEL.md`, `OPERATIONS.md`, `CLAUDE.md`.
- **Rollback:** `npm run routes:import -- --undo` (or deleting a route) brings the PDF tile
  back for that SLIC.

## Stage 2 — Drivers suggest, admins approve

- [ ] **`route-suggestions`** (per hub): `{ hubId, numSlic, userId, text, note, status:
      'open' | 'approved' | 'declined', decidedBy, decidedAt, answer, created_at }`,
      modeled on `slic-reports` (`lib/db/slicReports.js`).
- [ ] **Filing:**
  - "Suggest a change" in the Directions sheet, or "Add directions" on a SLIC with none,
    opens a soft form prefilled with the current steps, plus a note ("why it's better or
    truck-safe").
  - `POST /api/route-suggestions` (`requireUser`), rate-limited per driver
    (`lib/rateLimit.js`), plain text with a length cap. One open suggestion per driver per
    SLIC.
- [ ] **The queue,** `/admin/routes` (area `slics`; a `PAGE_TITLES` entry and a row on
      `/admin`), shows the current route next to the suggestion.
  - **Approve** (after an optional edit) saves through `saveRoute` with
    `source: 'suggestion'`.
  - **Decline** takes an optional answer the driver sees.
  - **Delete** writes `admin_audit` first.
- [ ] **Alerts:**
  - a banner on `/admin` and the header-menu badge through `GET /api/admin-alerts`, like
    `slicReports/SlicReportsNotice.jsx` and `lib/slicReportsStore.js`;
  - an admin push kind, `routeSuggestions` (`PUSH_TYPES`, area `slics`, on by default like
    SLIC reports), lock-screen safe: "SLIC 1813: a route suggestion".
- [ ] **Account deletion** unlinks a driver's suggestions (`userId` → null), like
      `unlinkUserSlicReports`.

## Stage 3 — Extra documents (railyard maps and more)

- [ ] **`slic-documents`** (shared): `{ numSlic, title, kind: 'image' | 'pdf', url, width,
      height, bytes, sortOrder, uploadedBy, created_at }`.
- [ ] **Storage:** `lib/blob.js` gains `putSlicDocument` / `deleteSlicDocument`
      (`slic-docs/<alpha>-…`, a random suffix, the old blob deleted after the save).
- [ ] **Routes:** `POST /api/slics/[id]/documents` and `PATCH`/`DELETE
      …/documents/[docId]` (area `slics`).
  - The server checks the content (`%PDF-`, JPEG/PNG/WebP signatures), not only the name.
  - A phone photo is resized in the browser (canvas, longest side 2400 px, JPEG) to stay
    under the 4 MB request limit.
  - Each change is in `slic_history` (`{ field: 'document', … }`) and sends
    `notifySlicEdit`.
- [ ] **Admin:** a Documents section on the edit page (`slicForm/SlicDocuments.jsx`): add
      with a title, rename, reorder, remove.
- [ ] **Driver:**
  - documents are listed in the Directions sheet, or behind a "Maps & docs" tile when
    there's no route;
  - images show inline (`img-src` already allows the Blob host) and open full screen to
    zoom;
  - PDFs open in a new tab.
- **Privacy:** like today's PDFs, the files are public URLs. `SECURITY.md` #13's fix (a
  signed-in route that streams them) covers both.

## Later

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
