export const SLICS_PER_PAGE = 5;

// How far back the cover bid jobs page loads weeks. A display window only —
// older weeks stay in the database and remain reachable from /admin/cover/jobs.
export const COVER_BID_MONTHS_BACK = 12;

export const ELEVATION = 6;
export const MAX_WIDTH = '32rem';
export const MIN_HEIGHT = '24rem';
export const BORDER_RADIUS = '6px';

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
  id: 'comment_id',
  created_at: '05/26/2025',
  content: 'This is a comment',
  author: 'user_id', // ID of the user who made the comment
  slicId: 'SLIC_ID', // ID of the SLIC this comment belongs to
  likes: ['user_id1', 'user_id2'], // Array of user IDs who liked the comment
};
