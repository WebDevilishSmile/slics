export const SLICS_PER_PAGE = 5;

// How far back the cover bid jobs page loads weeks. A display window only —
// older weeks stay in the database and remain reachable from /admin/cover/jobs.
export const COVER_BID_MONTHS_BACK = 12;

// DOM id on the comments section (comments/CommentsContainer.jsx). The comment
// count chip in home/TitleAddress.jsx scrolls to it; the two live in sibling
// client trees under the page, so a shared id beats threading a ref through.
export const COMMENTS_SECTION_ID = 'comments';

// Where slic PDFs lived before Vercel Blob: a public Supabase Storage bucket
// with one `<alphaSlic>.pdf` per slic, flagged by the legacy `slic.pdf` boolean.
// Still read by home/PdfLink.jsx as a fallback for any slic without a
// `pdfUrl`, and by the migration/rollback scripts. Remove once every slic has
// been migrated and the bucket is retired.
export const LEGACY_PDF_BASE_URL =
  'https://ndjeljyamsbvaibhgjmk.supabase.co/storage/v1/object/public/Customer%20Center%20Directions';

export function legacyPdfUrl(alphaSlic) {
  if (!alphaSlic) return null;
  return `${LEGACY_PDF_BASE_URL}/${String(alphaSlic).toLowerCase()}.pdf`;
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
};

// Statuses for a gym on the Planet Fitness page (/admin/planet-fitness). The
// form, the card's chip and the server-side check in utils/gymsApi.js all read
// this list, so a new status only needs adding here. `color` is a Chip color.
export const GYM_STATUSES = [
  { value: 'confirmed', label: 'Confirmed', color: 'success' },
  { value: 'to-check', label: 'To check', color: 'warning' },
  { value: 'no-go', label: 'No-go', color: 'error' },
];

// Gym comments are plain text; enforced in the form and in utils/gymsApi.js.
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
