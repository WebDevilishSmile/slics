// People's names as the app shows them: each word capitalized ("Jane Doe",
// "Doe, Jane"), however they were typed or stored. Account names come as
// drivers typed them, or as their Google profile has them ("jane doe"), and
// the on-call sheet writes everyone in capitals ("DOE, JANE"). Only for
// showing: stored names stay as they are (the sheet's copy is replaced on
// every sync, and the app never changes the sheet), and matching still goes
// by driverNameKey (lib/driverNames.js). No imports, so the server and
// client components share it.
//
// A word typed in both cases ("McDonald", "DeShawn", "LaToya") was capitalized
// on purpose and is left alone. A word all in one case is capitalized: its
// first letter and the letter after a hyphen ("Smith-Jones") or after a
// one-letter prefix and an apostrophe ("O'Brien"), and "Mc" names
// ("MCDONALD" → "McDonald"). Roman numerals stay in capitals ("III"), and so
// do two consonants, read as initials ("TJ").

const ROMAN = /^(ii|iii|iv|vi|vii|viii|ix)$/i;
const INITIALS = /^[b-df-hj-np-tv-z]{2}$/i;
const SUFFIXES = { jr: 'Jr', sr: 'Sr' };

const hasUpper = (text) => text !== text.toLowerCase();
const hasLower = (text) => text !== text.toUpperCase();

const capitalize = (text) => text.charAt(0).toLocaleUpperCase('en-US') + text.slice(1);

// One hyphen-free part of a word, all in one case.
function fixPart(part) {
  const letters = part.replace(/[^\p{L}]/gu, '');
  if (!letters || (hasUpper(letters) && hasLower(letters))) return part;
  const bare = letters.toLowerCase();
  if (SUFFIXES[bare]) return part.replace(/\p{L}+/u, SUFFIXES[bare]);
  if (ROMAN.test(letters) || INITIALS.test(letters)) return part.toLocaleUpperCase('en-US');
  const lower = part.toLocaleLowerCase('en-US');
  if (/^mc\p{L}{2,}$/u.test(lower)) return `Mc${capitalize(lower.slice(2))}`;
  // O'Brien, D'Angelo: one letter, an apostrophe, the rest.
  const apostrophe = /^(\p{L})(['’])(\p{L}.*)$/u.exec(lower);
  if (apostrophe) return `${apostrophe[1].toLocaleUpperCase('en-US')}${apostrophe[2]}${capitalize(apostrophe[3])}`;
  // Leading punctuation ("(JANE)") stays where it is.
  return lower.replace(/\p{L}/u, (letter) => letter.toLocaleUpperCase('en-US'));
}

// A name as the app shows it. Anything that isn't a string comes back as it was.
export function displayName(name) {
  if (typeof name !== 'string') return name;
  return name
    .split(/(\s+)/)
    .map((word) =>
      /\s/.test(word)
        ? word
        : // Hyphens and commas start a new part: "SMITH-JONES", "DOE,JANE".
          word
            .split(/([-,])/)
            .map((piece, index) => (index % 2 ? piece : fixPart(piece)))
            .join(''),
    )
    .join('');
}

// The first word of a name, as the app shows it ("jane doe" → "Jane").
export const displayFirstName = (name) =>
  typeof name === 'string' && name.trim() ? displayName(name.trim().split(/\s+/)[0]) : '';
