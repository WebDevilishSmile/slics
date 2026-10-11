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

// dayjs .day(n) sets the weekday within the current Sun-Sat week (0=Sun..6=Sat),
// so .day(6) always lands on that week's Saturday — same day if already Saturday,
// otherwise the upcoming one.
export function getUpcomingSaturday(date) {
  return date.day(6);
}
