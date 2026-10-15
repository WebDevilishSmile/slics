// Mongo documents carry ObjectIds and Dates, which can't cross from a server
// component into a client component. These turn them into strings.
export function serializeSlic(slicData) {
  return {
    ...slicData,
    _id: slicData._id.toString(),
  };
}

export function serializeSlics(slics) {
  return slics.map(serializeSlic);
}

export function serializeSlicHistoryEntry(entry) {
  return {
    ...entry,
    _id: entry._id.toString(),
    slicId: entry.slicId ? entry.slicId.toString() : null,
    timestamp:
      entry.timestamp instanceof Date
        ? entry.timestamp.toISOString()
        : entry.timestamp,
  };
}

export function serializeSlicHistory(history) {
  return history.map(serializeSlicHistoryEntry);
}

// Users pick their fields instead of spreading the document, so a field added
// to `users` later (or the password hash) never reaches the browser by
// default (docs/SECURITY.md #6). Add a field here only when a page shows it.
const isoDate = (value) => (value instanceof Date ? value.toISOString() : (value ?? null));

// A name and an avatar: comment authors on /admin/comments.
export function toPublicUser(user) {
  return { _id: user._id.toString(), name: user.name ?? '', image: user.image ?? null };
}

// The signed-in driver's own profile (/profile/[id]).
export function toSelfUser(user) {
  return {
    ...toPublicUser(user),
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    email: user.email ?? null,
    phone: user.phone ?? null,
    role: user.role ?? 'user',
    bmcMember: user.bmcMember === true,
    // Verified driver (lib/db/driverClaims.js): the name as the sheet spells it.
    driverVerified: Boolean(user.driver?.verifiedAt),
    driverName: user.driver?.name ?? null,
    created_at: isoDate(user.created_at),
  };
}

// A row on /admin/users.
export function toAdminUser(user) {
  return { ...toSelfUser(user), superAdmin: user.superAdmin === true };
}

// Updated Serialization for Comments
export function serializeComment(commentData) {
  return {
    ...commentData,
    _id: commentData._id.toString(),
    // Replies carry their thread's ObjectId, which can't cross into a client component.
    parentId: commentData.parentId ? commentData.parentId.toString() : null,
    // Convert Dates to ISO strings explicitly to prevent hydration drift
    created_at:
      commentData.created_at instanceof Date
        ? commentData.created_at.toISOString()
        : commentData.created_at,
    updated_at:
      commentData.updated_at instanceof Date
        ? commentData.updated_at.toISOString()
        : commentData.updated_at,
  };
}

export function serializeComments(commentsData) {
  return commentsData.map(serializeComment);
}

export function serializeSlicView(viewData) {
  return {
    ...viewData,
    _id: viewData._id.toString(),
    userId: viewData.userId ? viewData.userId.toString() : null,
    viewedAt:
      viewData.viewedAt instanceof Date
        ? viewData.viewedAt.toISOString()
        : viewData.viewedAt,
  };
}

export function serializeSlicViews(viewsData) {
  return viewsData.map(serializeSlicView);
}

// A cover job as a driver sees it on /covers (docs/COVER-BIDDING.md): whether
// it's picked, never by whom. `name`, `assignedDriver`, `coverReason` and the
// admin stamps stay on the server; only admins see who took a job.
export function toDriverCoverJob(job) {
  return {
    _id: job._id.toString(),
    weekEnding: job.weekEnding,
    jobNumber: job.jobNumber ?? '',
    description: job.description ?? '',
    sun: job.sun ?? '',
    mon: job.mon ?? '',
    tue: job.tue ?? '',
    wed: job.wed ?? '',
    thu: job.thu ?? '',
    fri: job.fri ?? '',
    sat: job.sat ?? '',
    sortOrder: job.sortOrder ?? null,
    picked: Boolean(job.name?.trim()),
  };
}

// A verified driver's This week card (getDriverWeeks, lib/db/driverWeeks.js)
// as their profile gets it. Every field is named here, so nothing else rides
// along: job codes, start times, hours, miles, routes and stop links. Never a
// cover job's `name`, `assignedDriver` or `coverReason`, nor another job's
// driver or seniority (CLAUDE.md, the Covers anonymity rule).
const toSchedule = (schedule) =>
  schedule
    ? {
        description: schedule.description ?? null,
        days: schedule.days.map((day) => ({
          day: day.day,
          start: day.start ?? null,
          hours: day.hours ?? null,
          miles: day.miles ?? null,
          route: day.route ?? null,
          works: Boolean(day.works),
          stops: day.stops.map((stop) => ({
            code: String(stop.code),
            numSlic: stop.numSlic ?? null,
            alpha: stop.alpha ?? null,
          })),
        })),
      }
    : null;

const ASSIGNMENT_FIELDS = ['kind', 'jobName', 'jobNumber', 'callIn', 'status', 'position', 'text'];

export function toDriverWeek(data) {
  if (!data) return null;
  return {
    today: data.today,
    ownJob: data.ownJob ? { jobName: data.ownJob.jobName, schedule: toSchedule(data.ownJob.schedule) } : null,
    weeks: data.weeks.map((week) => ({
      weekEnding: week.weekEnding,
      which: week.which,
      posted: Boolean(week.posted),
      assignment: Object.fromEntries(
        ASSIGNMENT_FIELDS.filter((key) => week.assignment[key] != null).map((key) => [key, week.assignment[key]]),
      ),
      schedule: toSchedule(week.schedule),
    })),
  };
}

// Gyms come from getAllGyms() with their comments joined in; both carry
// ObjectIds that can't cross the server/client boundary as-is. Timestamps are
// already ISO strings.
export function serializeGym(gymData) {
  return {
    ...gymData,
    _id: gymData._id.toString(),
    comments: (gymData.comments || []).map((comment) => ({
      ...comment,
      _id: comment._id.toString(),
      gymId: comment.gymId.toString(),
    })),
  };
}

export function serializeGyms(gymsData) {
  return gymsData.map(serializeGym);
}
