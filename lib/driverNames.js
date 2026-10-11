// Drivers' names as the on-call sheet writes them ("DOE, JANE" on the
// cover tabs, the `driver` column of the Jobs tab), and as a driver types their
// own when they ask to be verified ("Jane Doe"). No imports, so client and
// server both use it (docs/COVER-BIDDING.md).

// The form a name is matched and kept unique by (`users.driver.key`): upper
// case, no periods, single spaces, no spaces around the comma.
// "Doe,  Jane M." → "DOE,JANE M".
export function driverNameKey(name) {
  return String(name ?? '')
    .toUpperCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ',')
    .trim();
}

const tokens = (name) => driverNameKey(name).split(/[\s,'-]+/).filter(Boolean);

// The same words in any order: "DOE, JANE M" and "JANE M DOE".
export function sameDriverName(a, b) {
  const left = tokens(a).sort().join(' ');
  return left !== '' && left === tokens(b).sort().join(' ');
}

// The part before the comma, as the sheet writes a name ("DOE" in "DOE, JANE").
export const driverLastName = (name) => driverNameKey(name).split(',')[0];

// How alike two names are, 0 to 1, ignoring order: "Jane Doe" and
// "DOE, JANE" score 1. A short token that starts another ("J" and "JOHN",
// "MIKE" and "MIKEY") counts half.
export function nameMatchScore(a, b) {
  const left = tokens(a);
  const right = tokens(b);
  if (left.length === 0 || right.length === 0) return 0;

  let score = 0;
  const unused = [...right];
  for (const token of left) {
    const exact = unused.indexOf(token);
    if (exact >= 0) {
      score += 1;
      unused.splice(exact, 1);
      continue;
    }
    const partial = unused.findIndex(
      (other) => other.startsWith(token) || token.startsWith(other),
    );
    if (partial >= 0) {
      score += 0.5;
      unused.splice(partial, 1);
    }
  }
  return score / Math.max(left.length, right.length);
}

// The sheet's names most like the one a driver typed, best first, leaving out
// those that share nothing with it. Preselects the admin's pick on
// /admin/driver-claims; it never decides anything.
export function rankSheetNames(claimedName, names) {
  return names
    .map((name) => ({ name, score: nameMatchScore(claimedName, name) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map(({ name }) => name);
}
