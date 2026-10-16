// The app's address since 2026-10-12 (slics.app redirects here, and
// slics.vercel.app still answers). Links the app sends out use it in
// production: lib/siteOrigin.js.
export const SITE_URL = 'https://www.slics.app';

// Where drivers write in: the footer, /privacy, /terms, /help and /about. It
// forwards to the admin's inbox (docs/OPERATIONS.md, "Email for the domain").
export const CONTACT_EMAIL = 'tiago@slics.app';

// Rows per page in the admin SLICs table (admin/slics/SlicsTable.jsx).
export const SLICS_PER_PAGE = 25;

// The supporter page (layout/BmcButton.jsx, the menu, the lookup screen).
export const BMC_URL = 'https://buymeacoffee.com/tiagodavila';

// How far back the cover bid jobs page loads weeks. A display window only —
// older weeks stay in the database and remain reachable from /admin/cover/jobs.
export const COVER_BID_MONTHS_BACK = 12;

// DOM id on the comments section (comments/CommentsContainer.jsx). The comment
// count chip in home/TitleAddress.jsx scrolls to it; the two live in sibling
// client trees under the page, so a shared id beats threading a ref through.
export const COMMENTS_SECTION_ID = 'comments';

// Where slic PDFs lived before Vercel Blob: a public Supabase Storage bucket
// with one `<alphaSlic>.pdf` per slic, flagged by the legacy `slic.pdf` boolean.
// Still read by slicPdfHref below as a fallback for any slic without a
// `pdfUrl`, and by the migration/rollback scripts. Remove once every slic has
// been migrated and the bucket is retired.
export const LEGACY_PDF_BASE_URL =
  'https://ndjeljyamsbvaibhgjmk.supabase.co/storage/v1/object/public/Customer%20Center%20Directions';

export function legacyPdfUrl(alphaSlic) {
  if (!alphaSlic) return null;
  return `${LEGACY_PDF_BASE_URL}/${String(alphaSlic).toLowerCase()}.pdf`;
}

// The directions PDF link for a slic, or null when it has none (the PDF button
// in home/SlicActions.jsx is hidden then). `pdfUrl` (Vercel Blob) wins. Any
// slic not yet migrated still carries the legacy `pdf` boolean, which meant "a
// <alphaSlic>.pdf exists in the old Supabase bucket", so keep honoring it and
// no link breaks mid-migration.
export function slicPdfHref(slic) {
  return slic.pdfUrl || (slic.pdf ? legacyPdfUrl(slic.alphaSlic) : null);
}

// Upload cap for slic PDFs, checked in both slicForm/PdfUpload.jsx and the
// upload route. Vercel serverless functions reject request bodies over
// 4.5 MB, so this sits a little under that; directions PDFs are one-pagers.
export const SLIC_PDF_MAX_BYTES = 4 * 1024 * 1024;

export const SLIC_CENTER_EXAMPLE = {
  id: 'SLIC_ID',
  created_at: '05/26/2025',
  type: 'center',
  numSlic: '1809',
  alphaSlic: 'BETPA',
  name: 'Bethlehem Center',
  phone: '(484) 291-5900',
  address: {
    street: '1620 Van Buren Road',
    city: 'Easton',
    zip: '18045',
  },
  directions: 'url', // Can be null
};
export const SLIC_CUSTOMER_EXAMPLE = {
  id: 'SLIC_ID',
  created_at: '05/26/2025',
  type: 'customer',
  numSlic: '1813',
  alphaSlic: 'ULNPA',
  name: 'Uline',
  phone: null, // Can be null for customers
  address: {
    street: '1620 Van Buren Road',
    city: 'Easton',
    zip: '18045',
  },
  directions: null, // Can be null for customers
  comments: ['comment_id'],
};

export const SLIC_COMMENT_EXAMPLE = {
  _id: 'comment_id',
  created_at: '2025-05-26T14:03:00.000Z', // ISO string (older docs may be MM/DD/YY)
  content: 'This is a comment',
  userId: 'user_id', // ID of the user who made the comment
  numSlic: 'SLIC_ID', // numSlic of the SLIC this comment belongs to
  upVotes: ['user_id1', 'user_id2'], // Array of user IDs who upvoted the comment
  downVotes: [], // Array of user IDs who downvoted the comment
  pin: { lat: 40.2732, lng: -76.8867 }, // optional spot the tip points at
};

// Statuses for a gym on the Planet Fitness page (/admin/planet-fitness). The
// form, the card's chip and the server-side check in lib/db/gyms.js all read
// this list, so a new status only needs adding here. `color` is a Chip color.
export const GYM_STATUSES = [
  { value: 'confirmed', label: 'Confirmed', color: 'success' },
  { value: 'to-check', label: 'To check', color: 'warning' },
  { value: 'no-go', label: 'No-go', color: 'error' },
];

// Gym comments are plain text; enforced in the form and in lib/db/gyms.js.
export const GYM_COMMENT_MAX_LENGTH = 2000;

export const GYM_EXAMPLE = {
  _id: 'gym_id',
  name: 'Carlisle – Noble Blvd',
  address: {
    street: '1 Noble Blvd',
    city: 'Carlisle',
    state: 'PA',
    zip: '17013',
  },
  phone: '(717) 555-0100', // '' when unknown
  status: 'confirmed', // one of GYM_STATUSES
  open24h: false,
  hours: 'Mon–Thu 5am–11pm', // '' when open24h
  parking: { lat: 40.2012, lng: -77.1601 }, // truck-parking pin, or null
  slics: ['1809'], // numSlics this gym is on the way to/from
  lastVisited: '2026-10-02T15:30:00.000Z', // ISO string, or null
  created_at: '2026-10-01T12:00:00.000Z',
  createdBy: { id: 'user_id', name: 'Name', email: 'email' },
  updated_at: null,
  updatedBy: null,
};

export const GYM_COMMENT_EXAMPLE = {
  _id: 'comment_id',
  gymId: 'gym_id', // ObjectId of the gym
  userId: 'user_id', // string, like SLIC comments
  userName: 'Name',
  content: 'Exit 52, second light. Park along the back fence.', // plain text
  created_at: '2026-10-01T12:00:00.000Z',
  updated_at: null,
};

// Places opened to every driver on 2026-10-12. Its header-menu row says "New"
// until this moment (header/UserMenu.jsx; ISO strings compare in time order).
// Remove it, and the check, once it has passed.
export const PLACES_NEW_UNTIL = '2026-11-12T00:00:00.000Z';

// Categories a place on /places can have; a place picks one or more. Adding a
// category is a one-line change here; give it an icon in
// places/PlaceCategoryIcon.jsx (it falls back to a map pin).
export const PLACE_CATEGORIES = [
  { value: 'fuel', label: 'Fuel' },
  { value: 'food', label: 'Food' },
  { value: 'restroom', label: 'Restroom' },
  { value: 'rest-area', label: 'Rest area' },
  { value: 'truck-parking', label: 'Truck parking' },
  { value: 'showers', label: 'Showers' },
  { value: 'other', label: 'Other' },
];

// Whether a tractor-trailer gets in and out — set by whoever added the place;
// other drivers weigh in through comments. `color` is a Chip color.
export const TRAILER_ACCESS = [
  { value: 'yes', label: 'Trailer fits', color: 'success' },
  { value: 'tight', label: 'Tight for a trailer', color: 'warning' },
  { value: 'no', label: 'No trailers', color: 'error' },
  { value: 'unknown', label: 'Trailer access unknown', color: 'default' },
];

// Place comments are plain text; enforced in the form and in lib/db/places.js.
export const PLACE_COMMENT_MAX_LENGTH = 2000;

export const PLACE_EXAMPLE = {
  _id: 'place_id',
  name: 'Pilot #312',
  categories: ['fuel', 'food', 'restroom'], // values from PLACE_CATEGORIES
  trailerAccess: 'yes', // one of TRAILER_ACCESS
  address: {
    street: '1501 Harrisburg Pike', // '' allowed when there's a pin (rest areas)
    city: 'Carlisle',
    state: 'PA',
    zip: '17015',
  },
  phone: '(717) 555-0100', // '' when unknown
  open24h: true,
  hours: '', // free text when !open24h
  parking: { lat: 40.1912, lng: -77.2401 }, // where to pull in, or null
  slics: ['1809'], // numSlics it's on the way to/from
  createdBy: 'user_id', // string; null once that driver deletes their account
  created_at: '2026-10-07T12:00:00.000Z',
  updated_at: null,
  updatedBy: null, // user id string of the last editor
};

export const PLACE_COMMENT_EXAMPLE = {
  _id: 'comment_id',
  placeId: 'place_id', // ObjectId of the place
  parentId: null, // ObjectId of the top-level comment for a reply; null = top-level
  userId: 'user_id', // string; null on a soft-deleted comment
  content: 'Diesel lanes are around back. Lot fills up after 6pm.', // plain text
  upVotes: ['user_id1'], // string user ids, like SLIC comments
  downVotes: [],
  deleted: false, // true = "Comment deleted" placeholder kept for its replies
  created_at: '2026-10-07T12:00:00.000Z',
  updated_at: null,
};

// SLIC comments (driver tips) are plain text since 2026-10-07; enforced in
// the composer and in lib/db/comments.js (validateSlicComment).
export const SLIC_COMMENT_MAX_LENGTH = 2000;

// "Something wrong?" reports on a SLIC (RECOMMENDATIONS.md #5): what a driver
// can say is wrong, in the order the form shows them. `needsNote`: "other"
// says nothing on its own.
export const SLIC_REPORT_KINDS = [
  { value: 'phone', label: 'Wrong phone number' },
  { value: 'address', label: 'Wrong address' },
  { value: 'closed', label: 'Closed or moved' },
  { value: 'other', label: 'Something else', needsNote: true },
];
export const SLIC_REPORT_NOTE_MAX_LENGTH = 500;

// A new password's length, at sign-up and on a reset (lib/password.js).
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
// How long a reset link from "Forgot your password?" works
// (app/api/auth/forgot-password, signIn/ForgotPassword.jsx).
export const RESET_EMAIL_LINK_MINUTES = 30;

// Covers and driver verification (docs/COVER-BIDDING.md) are admin-only until
// they roll out to every driver: `canUseCovers` in lib/authz.js and the menu
// read this. Only the default: the switch on /admin/super/features wins. Flip it with the rollout checklist in that doc.
export const COVERS_OPEN = false;
// A verified driver's cover list (docs/COVER-BIDDING.md, stage 2): the jobs
// they want for a week, in order. At most this many per week, and a week's
// lists are deleted this many days after the week ends (a TTL index).
export const COVER_LIST_MAX = 30;
export const COVER_LIST_KEEP_DAYS = 28;
// The SLIC whose phone the cover list's "Call dispatch" dials: BETPA, the
// drivers' own hub. By number, which never changes (CLAUDE.md, Data layer), so
// editing the hub's phone in the SLIC form updates the button.
export const DISPATCH_NUM_SLIC = '1809';
// A driver's name as they claim it, or as the on-call sheet spells it.
export const DRIVER_NAME_MAX_LENGTH = 60;
// The reason an admin gives for turning a claim down, shown to the driver.
export const DRIVER_CLAIM_NOTE_MAX_LENGTH = 300;
// A verified driver's note saying they should be on the week's cover list
// (lib/db/coverDisputes.js), and the admin's answer, which the driver sees.
export const COVER_DISPUTE_NOTE_MAX_LENGTH = 300;

// The hours on the "What it takes" card (/about, support/WhatItTakes.jsx), a
// floor estimated 2026-10-10: git shows about 60 work sessions since May 2025
// at roughly 2.5 hours each (about 150 hours; most 2025 sessions left only one
// to three commits, so commit times alone undercount), plus entering and
// checking 357 SLICs (about 30 hours) and 65 directions PDFs (about 11 hours).
// Answering drivers and admin work aren't counted. Raise it as you go.
export const SUPPORT_HOURS_ESTIMATE = 200;

// When the app icon last changed (the Waypoint icon, public/slics-icon.svg).
// An iPhone keeps the icon a driver installed with, so /home asks drivers in
// the installed iPhone app to add it again (install/NewIconNotice.jsx) until
// they dismiss that notice after this moment (`users.iconNoticeDismissedAt`).
// Move it forward with the next icon change.
export const ICON_CHANGED_AT = '2026-10-11T00:00:00.000Z';

// Push notifications are admin-only until stage 2 rolls out to every driver
// (docs/PUSH-NOTIFICATIONS.md): `canUsePush` in lib/authz.js reads this. Only
// the default: the switch on /admin/super/features wins. Turning it off again
// is the rollback, and it stops sends to drivers too.
export const PUSH_OPEN = false;

// The kinds of push notification a driver can choose on /profile
// (docs/PUSH-NOTIFICATIONS.md, stages 1b and 2), in the order the switches
// show. Choices are per account (`users.pushPrefs[key]`); a key the account
// never set means `defaultOn`. `audience` says who's offered and sent a kind:
// 'driver' everyone `canUsePush` lets in (lib/authz.js), 'admin' admins,
// 'superAdmin' super admins. The wording of each notification is in
// lib/pushEvents.js.
export const PUSH_TYPES = [
  // A driver has opted in by turning the device on, so these start on: with
  // them off, a device that's on would get nothing.
  {
    key: 'tipReplies',
    group: 'Your tips',
    label: 'Replies',
    description: 'Someone replies to your tip, or after you in a thread.',
    audience: 'driver',
    defaultOn: true,
  },
  {
    key: 'placeComments',
    group: 'Places',
    label: 'Comments',
    description: 'A comment on a place you added, or a reply after you in a thread.',
    audience: 'driver',
    defaultOn: true,
  },
  {
    key: 'jobChanges',
    group: 'On-call sheet',
    label: 'Job changes',
    description: 'Jobs added, removed or changed on the Jobs tab.',
    audience: 'admin',
    defaultOn: true,
  },
  {
    key: 'coverJobs',
    group: 'On-call sheet',
    label: 'Cover jobs',
    description: "Cover jobs added, removed or changed on a week's tab, and new weeks posted.",
    audience: 'admin',
    defaultOn: true,
  },
  {
    key: 'coverPicks',
    group: 'On-call sheet',
    label: 'Cover picks',
    description: "Drivers' picks changed on a cover week.",
    audience: 'admin',
    defaultOn: false,
  },
  {
    key: 'slicReports',
    group: 'Drivers',
    label: 'SLIC reports',
    description: 'A driver reports something wrong with a SLIC.',
    audience: 'admin',
    defaultOn: true,
  },
  {
    key: 'tips',
    group: 'Drivers',
    label: 'Tips',
    description: 'New tips and replies on any SLIC.',
    audience: 'admin',
    defaultOn: false,
  },
  {
    key: 'driverClaims',
    group: 'Drivers',
    label: 'Driver claims',
    description: 'A driver asks to be verified for Covers.',
    audience: 'admin',
    defaultOn: false,
  },
  {
    key: 'coverDisputes',
    group: 'Drivers',
    label: 'Cover list disputes',
    description: "A verified driver says they should be on the week's cover list.",
    audience: 'admin',
    defaultOn: true,
  },
  {
    key: 'signUps',
    group: 'Drivers',
    label: 'Sign-ups',
    description: 'Someone makes a SLICs account.',
    audience: 'admin',
    defaultOn: false,
  },
  {
    key: 'places',
    group: 'Drivers',
    label: 'Places',
    description: 'A new place, or a comment on one.',
    audience: 'admin',
    defaultOn: false,
  },
  {
    key: 'slicEdits',
    group: 'Admins',
    label: 'SLIC edits',
    description: 'Another admin adds, edits or deletes a SLIC.',
    audience: 'admin',
    defaultOn: false,
  },
  {
    key: 'support',
    group: 'Supporters',
    label: 'Buy Me a Coffee',
    description: 'Coffees, memberships, renewals and cancellations.',
    audience: 'superAdmin',
    defaultOn: false,
  },
];
// A notification the super admin writes on /admin/super/notifications: what
// fits on a lock screen.
export const PUSH_COMPOSE_TITLE_MAX = 60;
export const PUSH_COMPOSE_BODY_MAX = 180;

// The kinds of row in the super admin's activity feed (/admin/super/activity,
// lib/db/activity.js), in the order the filter chips show.
export const ACTIVITY_KINDS = [
  { key: 'signUps', label: 'Sign-ups' },
  { key: 'tips', label: 'Tips' },
  { key: 'reports', label: 'Reports' },
  { key: 'claims', label: 'Claims' },
  { key: 'slics', label: 'SLIC edits' },
  { key: 'jobs', label: 'Jobs tab' },
  { key: 'coverJobs', label: 'Cover jobs' },
  { key: 'picks', label: 'Cover picks' },
  { key: 'places', label: 'Places' },
  { key: 'support', label: 'Support' },
  { key: 'admin', label: 'Admin actions' },
  { key: 'push', label: 'Notifications' },
];

// Staff roles and the admin tools ("areas") each may use (docs/STAFF-ROLES.md).
// A role is `users.role`: 'user' (every driver), 'dispatch' or 'admin'. Which
// areas a staff role has is the super admin's choice on /admin/super/admins
// (lib/db/appSettings.js); these are only the defaults. A super admin has
// every area whatever is saved. Every admin page and route checks its area
// (`getAreaSession` / `requireArea`, lib/authz.js), so a new admin page or
// route belongs to one of these, or to a new one added here.
export const STAFF_ROLES = ['admin', 'dispatch'];
export const ROLE_LABELS = { user: 'User', dispatch: 'Dispatch', admin: 'Admin' };

// In the order the /admin and /dispatch hubs list their links.
export const STAFF_AREAS = [
  {
    key: 'slics',
    label: 'SLICs',
    description: 'Add, edit and delete SLICs and their PDFs.',
    links: [{ href: '/admin/slics', label: 'SLICs' }],
  },
  {
    key: 'reports',
    label: 'SLIC reports',
    description: 'Fix or close what drivers report wrong with a SLIC.',
    links: [{ href: '/admin/reports', label: 'SLIC Reports' }],
  },
  {
    key: 'driverClaims',
    label: 'Driver claims',
    description: 'Verify drivers for Covers and answer cover list disputes.',
    links: [{ href: '/admin/driver-claims', label: 'Driver Claims' }],
  },
  {
    key: 'comments',
    label: 'Comments',
    description: 'Every tip on one page. Edit or delete any tip, place or place comment.',
    links: [{ href: '/admin/comments', label: 'Comments' }],
  },
  {
    key: 'users',
    label: 'Users',
    description: 'Every account: membership, phone and password reset links.',
    links: [{ href: '/admin/users', label: 'Users' }],
  },
  {
    key: 'jobs',
    label: 'Jobs',
    description: 'The Jobs tab of the on-call sheet and its changes.',
    links: [{ href: '/admin/jobs', label: 'Jobs' }],
  },
  {
    key: 'covers',
    label: 'Covers',
    description: 'Cover jobs, drivers and lists, and Covers before it opens to every driver.',
    links: [
      { href: '/admin/cover/drivers', label: 'Cover Drivers' },
      { href: '/admin/cover/jobs', label: 'Cover Jobs' },
      { href: '/admin/cover/lists', label: 'Cover Lists' },
    ],
  },
  {
    key: 'drivers',
    label: 'Drivers',
    description: 'The driver roster: employee IDs, seniority dates and phones.',
    links: [{ href: '/admin/drivers', label: 'Drivers' }],
  },
  {
    key: 'gyms',
    label: 'Planet Fitness',
    description: 'The list of truck-accessible gyms.',
    links: [{ href: '/admin/planet-fitness', label: 'Planet Fitness' }],
  },
];
export const STAFF_AREA_KEYS = STAFF_AREAS.map((area) => area.key);
// Admins start with every area, Dispatch with SLICs only.
export const ROLE_AREA_DEFAULTS = {
  admin: STAFF_AREA_KEYS,
  dispatch: ['slics'],
};
