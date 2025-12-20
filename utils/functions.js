// Function to format phone numbers
export function formatPhoneNumber(value) {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');

  // Format based on length
  const len = digits.length;
  if (len === 0) return '';
  if (len < 4) return `(${digits}`;
  if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

// Function to capitalize the first letter of each word in a string
export function capitalizeWords(str) {
  if (!str) return '';
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Function to capitalize the first letter of a string
export function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// FunctionS to serialize data
export function serializeSlic(slicData) {
  return {
    ...slicData,
    _id: slicData._id.toString(),
  };
}

export function serializeSlics(slics) {
  return slics.map(serializeSlic);
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

export function serializeCover(coverData) {
  return {
    ...coverData,
    _id: coverData._id.toString(),
  };
}

export function serializeCovers(coversData) {
  return coversData.map(serializeCover);
}

// Helper function to detect mobile based on User-Agent
export function isMobileDevice(userAgent) {
  if (!userAgent) return false;
  const mobileRegex =
    /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|rim)|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i;
  const tabletRegex = /android|ipad|playbook|silk/i; // Catch tablets too

  return mobileRegex.test(userAgent) || tabletRegex.test(userAgent);
}
