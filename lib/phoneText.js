// Phone numbers in a driver's plain-text tip (comments/CommentContent.jsx,
// validateSlicComment in lib/db/comments.js). Pure, so the server and the tip
// forms share one copy.
//
// A number is 10 digits as people type them: (610) 555-0134, 610-555-0134,
// 610.555.0134, 610 555 0134, 6105550134, with an optional +1 or 1 in front.
// The area code and the exchange start with 2–9, as every real US number's
// do, and the number can't touch other digits, so a job code, a trailer
// number, a SLIC or a date isn't taken for one. Every number is saved and
// shown one way: (610) 555-0134.
const PHONE =
  /(?<![\d+])(?:\+?1[\s.-]?)?(?:\(([2-9]\d{2})\)\s?|([2-9]\d{2})[\s.-]?)([2-9]\d{2})[\s.-]?(\d{4})(?!\d)/g;

// Something written like a phone number, with its parts split up, whether or
// not it is one: three digits (maybe in parentheses), three more, then 3–5
// after a dash, dot or space. "610-555-013" and "123-456-7890" are; a plain
// run of digits, a date or a job code isn't.
const PHONE_SHAPED = /(?<![\d+])(?:\+?1[\s.-]?)?(?:\(\d{3}\)\s?|\d{3}[\s.-])\d{3}[\s.-]\d{3,5}(?!\d)/g;

export const formatPhone = (area, exchange, line) => `(${area}) ${exchange}-${line}`;

// → [{ text }, { text, tel, display }, …] in order; joined, the `text`s are
// the original string. `tel` is "+16105550134", `display` "(610) 555-0134".
export function splitPhoneNumbers(value) {
  const text = String(value ?? '');
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(PHONE)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    const area = match[1] ?? match[2];
    parts.push({
      text: match[0],
      tel: `+1${area}${match[3]}${match[4]}`,
      display: formatPhone(area, match[3], match[4]),
    });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

// The text with every phone number written (610) 555-0134, as a tip is saved.
export const formatPhoneNumbers = (value) =>
  splitPhoneNumbers(value)
    .map((part) => part.display ?? part.text)
    .join('');

const isWholePhone = (text) => {
  const parts = splitPhoneNumbers(text);
  return parts.length === 1 && Boolean(parts[0].tel);
};

// The things in the text written like a phone number that aren't one: a
// digit short or over ("610-555-013"), or an area code or exchange starting
// with 0 or 1 ("123-456-7890").
export const findBadPhoneNumbers = (value) =>
  [...String(value ?? '').matchAll(PHONE_SHAPED)].map((match) => match[0]).filter((text) => !isWholePhone(text));

// For a tip box: `{ error }` when a number looks wrong (the tip isn't saved),
// else `{ hint }` when it has numbers that will be written differently, else
// {}. The server says the same (validateSlicComment).
export function tipPhoneHelp(value) {
  const bad = findBadPhoneNumbers(value);
  if (bad.length) {
    return { error: `${bad[0].trim()} doesn't look like a phone number. Write it like (610) 555-0134.` };
  }
  const changed = splitPhoneNumbers(value).filter((part) => part.tel && part.text !== part.display);
  if (changed.length) return { hint: `Phone numbers save as ${changed[0].display}.` };
  return {};
}
