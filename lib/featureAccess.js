import { COVERS_OPEN, PUSH_OPEN } from '@/constants';
import { userHasArea } from '@/lib/staffAreas';

// Who may use Covers and notifications, as rules on a session's `user` and
// `features` (auth.js puts both on every session, fresh like `role`). Pure,
// so lib/authz.js and client components (the header menu, the push nudge)
// share one copy instead of each writing it from memory. Server code checks
// them through canUseCovers / canUsePush (lib/authz.js); who a push is sent
// to is the same rule as a query (pushAllowedFilter, lib/db/users.js), so
// change the two together.

// Covers (docs/COVER-BIDDING.md): everyone once the super admin's "Covers
// for every driver" switch is on. Until then, staff with the Covers area
// (the testers; a super admin has every area, as hasArea in lib/authz.js
// says) and anyone the super admin gave early access.
export const coversAllowed = (user, features) =>
  Boolean(user?.id) &&
  ((features?.coversOpen ?? COVERS_OPEN) ||
    (user.role === 'admin' && user.superAdmin === true) ||
    userHasArea(user, 'covers') ||
    user.coversAccess === true);

// A driver an admin verified (lib/db/driverClaims.js), who can use Covers.
export const isCoverDriver = (user, features) =>
  coversAllowed(user, features) && user.driverVerified === true;

// Notifications (docs/PUSH-NOTIFICATIONS.md): everyone once the super admin's
// "Notifications for every driver" switch is on. Until then, admins and
// verified cover drivers (stage 3), whose reminders and list changes are
// the reason to have them.
export const pushAllowed = (user, features) =>
  Boolean(user?.id) &&
  ((features?.pushOpen ?? PUSH_OPEN) || user.role === 'admin' || isCoverDriver(user, features));
