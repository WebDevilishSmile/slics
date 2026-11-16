// Finds US phone numbers in a driver's plain-text tip, so the tip can show
// each as a tap-to-call button (comments/CommentContent.jsx). Pure.
//
// A number is 10 digits as people type them: (610) 555-0134, 610-555-0134,
// 610.555.0134, 610 555 0134, 6105550134, with an optional +1 or 1 in front.
// The area code and the exchange start with 2–9, as every real US number's
// do, and the number can't touch other digits, so a job code, a trailer
// number, a SLIC or a date isn't taken for one.
const PHONE =
  /(?<![\d+])(?:\+?1[\s.-]?)?(?:\(([2-9]\d{2})\)\s?|([2-9]\d{2})[\s.-]?)([2-9]\d{2})[\s.-]?(\d{4})(?!\d)/g;

// → [{ text }, { text, tel }, …] in order; joined, the `text`s are the
// original string. `tel` is "+16105550134".
export function splitPhoneNumbers(value) {
  const text = String(value ?? '');
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(PHONE)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    const area = match[1] ?? match[2];
    parts.push({ text: match[0], tel: `+1${area}${match[3]}${match[4]}` });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
