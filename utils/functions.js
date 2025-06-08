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

export function capitalizeWords(str) {
  if (!str) return '';
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

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

export function serializeComment(commentData) {
  return {
    ...commentData,
    _id: commentData._id.toString(),
  };
}
