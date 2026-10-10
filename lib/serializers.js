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

export function serializeUser(userData) {
  return {
    ...userData,
    _id: userData._id.toString(),
  };
}
export function serializeUsers(usersData) {
  return usersData.map((user) => ({
    ...user,
    _id: user._id.toString(),
  }));
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

export function serializeDriver(driverData) {
  return {
    ...driverData,
    _id: driverData._id.toString(),
  };
}

export function serializeDrivers(driversData) {
  return driversData.map((driver) => ({
    ...driver,
    _id: driver._id.toString(),
  }));
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

export function serializeBidJob(job) {
  return { ...job, _id: job._id.toString() };
}

export function serializeBidJobs(jobs) {
  return jobs.map(serializeBidJob);
}
