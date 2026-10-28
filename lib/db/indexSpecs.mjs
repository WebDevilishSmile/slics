// Every index the app relies on, one entry per index: `{ collection, spec,
// options? }`. Plain data, read by `npm run db:indexes`
// (scripts/createIndexes.js) to create them and by the super admin's health
// page (lib/systemHealth.js) to spot any not created yet. Add an index here,
// then run `npm run db:indexes` once (docs/OPERATIONS.md).
export const INDEXES = [
  { collection: 'users', spec: { email: 1 } },
  { collection: 'comments', spec: { numSlic: 1, upVotes: -1 } },
  { collection: 'slicViews', spec: { userId: 1, viewedAt: -1 } },
  // Lookups in a time range for everyone (the impact line, the super
  // admin hub's counts and charts).
  { collection: 'slicViews', spec: { viewedAt: -1 } },
  { collection: 'slics', spec: { numSlic: 1 } },
  // Backs the six-month range scan on the cover bid jobs page and, as a
  // prefix, the single-week equality match used by the admin manager.
  { collection: 'cover-bid-jobs', spec: { weekEnding: -1, sortOrder: 1 } },
  // A week's picks and pick changes from the on-call sheet
  // (docs/ON-CALL-SHEET-SYNC.md).
  { collection: 'cover-bid-picks', spec: { weekEnding: 1 }, options: { unique: true } },
  { collection: 'cover-bid-pick-events', spec: { weekEnding: 1, seenAt: -1 } },
  // What changed on each week's cover tab (lib/db/coverJobChanges.js): the
  // Changes list, the unseen count behind the alerts, and the activity feed.
  { collection: 'cover-job-changes', spec: { seenAt: -1 } },
  // Cover jobs hidden from drivers, one per week and job number
  // (docs/COVER-JOB-HIDING.md); /covers reads a range of weeks.
  { collection: 'cover-bid-job-hides', spec: { weekEnding: 1, jobKey: 1 }, options: { unique: true } },
  // Weeks whose bid day an admin moved off the usual Thursday, one per week
  // (lib/db/coverBidDays.js); /covers and the reminders read from a week on.
  { collection: 'cover-bid-days', spec: { weekEnding: 1 }, options: { unique: true } },
  // What the Covers notifications cron already sent (lib/db/coverNotices.js):
  // the unique key lets one run send each notice, the userId index backs
  // account deletion, and the TTL deletes a week's 28 days after it ends.
  { collection: 'cover-notices', spec: { key: 1 }, options: { unique: true } },
  { collection: 'cover-notices', spec: { userId: 1 } },
  { collection: 'cover-notices', spec: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } },
  // Verified drivers' cover lists, one per driver per week
  // (docs/COVER-BIDDING.md, stage 2). The admin page reads a week; the
  // TTL deletes a week's lists COVER_LIST_KEEP_DAYS after it ends.
  { collection: 'cover-preferences', spec: { userId: 1, weekEnding: 1 }, options: { unique: true } },
  { collection: 'cover-preferences', spec: { weekEnding: 1 } },
  { collection: 'cover-preferences', spec: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } },
  // The sheet's Jobs tab and its change history.
  { collection: 'sheet-jobs', spec: { jobName: 1 }, options: { unique: true } },
  { collection: 'sheet-job-changes', spec: { seenAt: -1 } },
  { collection: 'sheet-job-changes', spec: { jobName: 1, seenAt: -1 } },
  // The $lookup in gymsApi.getAllGyms joins comments by gymId.
  { collection: 'gymComments', spec: { gymId: 1, created_at: -1 } },
  // A place's thread (placesApi.getPlaceThread) and the reply counts behind
  // the soft-delete rule; userId backs account deletion's cleanup.
  { collection: 'placeComments', spec: { placeId: 1, parentId: 1 } },
  { collection: 'placeComments', spec: { userId: 1 } },
  // Driver reports on SLICs (lib/db/slicReports.js): the open queue and
  // the closed list, and the account-deletion unlink.
  { collection: 'slic-reports', spec: { status: 1, created_at: 1 } },
  { collection: 'slic-reports', spec: { userId: 1 } },
  // Buy Me a Coffee deliveries (docs/BMC-SUPPORT.md). The unique key (a hash
  // of the body) makes a retried or replayed delivery a no-op.
  { collection: 'bmc-events', spec: { key: 1 }, options: { unique: true } },
  { collection: 'bmc-events', spec: { receivedAt: -1 } },
  { collection: 'bmc-events', spec: { userId: 1, receivedAt: -1 } },
  // The roster (lib/db/drivers.js): one row per employee ID, and one row per
  // driver on the on-call sheet it's linked to (lib/driverRoster.js).
  { collection: 'drivers', spec: { employeeId: 1 }, options: { unique: true } },
  {
    collection: 'drivers',
    spec: { sheetKey: 1 },
    options: { unique: true, partialFilterExpression: { sheetKey: { $type: 'string' } } },
  },
  // An admin's actions on the super admin's Admins page (lib/db/adminAudit.js).
  { collection: 'admin_audit', spec: { actorId: 1, at: -1 } },
  // Driver verification (lib/db/driverClaims.js, docs/COVER-BIDDING.md):
  // the admin queue; a driver's latest claim and account deletion; at most
  // one pending claim per driver; one account per name on the sheet.
  { collection: 'driver-claims', spec: { status: 1, created_at: 1 } },
  { collection: 'driver-claims', spec: { userId: 1, created_at: -1 } },
  {
    collection: 'driver-claims',
    spec: { userId: 1 },
    options: { unique: true, partialFilterExpression: { status: 'pending' } },
  },
  // "This is a mistake" on /covers (lib/db/coverDisputes.js): the admin
  // list; a driver's latest and account deletion; one open per driver.
  { collection: 'cover-disputes', spec: { status: 1, created_at: 1 } },
  { collection: 'cover-disputes', spec: { userId: 1, created_at: -1 } },
  {
    collection: 'cover-disputes',
    spec: { userId: 1 },
    options: { unique: true, partialFilterExpression: { status: 'open' } },
  },
  {
    collection: 'users',
    spec: { 'driver.key': 1 },
    options: { unique: true, partialFilterExpression: { 'driver.key': { $type: 'string' } } },
  },
  // Web push (lib/db/pushSubscriptions.js): one row per device, so a
  // re-saved subscription updates its row; userId for sends and account
  // deletion.
  { collection: 'push-subscriptions', spec: { endpoint: 1 }, options: { unique: true } },
  { collection: 'push-subscriptions', spec: { userId: 1 } },
  // The push send log (lib/db/pushLog.js): read newest first, and the TTL
  // deletes a row 90 days after its send (PUSH_LOG_KEEP_DAYS).
  { collection: 'push-log', spec: { at: 1 }, options: { expireAfterSeconds: 90 * 24 * 60 * 60 } },
  // Password reset links (lib/db/passwordResets.js): looked up by the
  // token's hash; one per account; gone once expired.
  { collection: 'password-resets', spec: { tokenHash: 1 }, options: { unique: true } },
  { collection: 'password-resets', spec: { userId: 1 } },
  { collection: 'password-resets', spec: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } },
  // Email confirmation links (lib/db/emailConfirmations.js): the same three.
  { collection: 'email-confirmations', spec: { tokenHash: 1 }, options: { unique: true } },
  { collection: 'email-confirmations', spec: { userId: 1 } },
  { collection: 'email-confirmations', spec: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } },
];
