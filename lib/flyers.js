// The printed flyers (docs/print/, each PDF beside its HTML source), which the
// super admin can attach to an email on /admin/super/email. Pure, so the
// compose form lists them and POST /api/emails checks them with the same list.
// The PDFs aren't on the website: they're bundled with that route
// (`outputFileTracingIncludes` in next.config.mjs) and read from disk when an
// email is sent, so a flyer re-made in docs/print goes out from the next
// deploy. A new flyer gets a line here.

export const FLYERS = [
  { key: 'slics', label: 'SLICs flyer', about: 'Looking up a SLIC', file: 'SLICS-FLYER.pdf' },
  { key: 'tips', label: 'Driver tips', about: 'Reading and leaving tips', file: 'TIPS-FOR-DRIVERS.pdf' },
  { key: 'directions', label: 'Directions', about: 'Directions, maps and docs', file: 'DIRECTIONS-FOR-DRIVERS.pdf' },
  { key: 'covers', label: 'Covers', about: 'Cover lists and bid day', file: 'COVERS-FOR-DRIVERS.pdf' },
  {
    key: 'sheet',
    label: 'On-call sheet conventions',
    about: 'For the sheet’s keepers',
    file: 'ON-CALL-SHEET-CONVENTIONS.pdf',
  },
];

export const FLYERS_DIR = 'docs/print';

const byKey = new Map(FLYERS.map((flyer) => [flyer.key, flyer]));

export const flyerByKey = (key) => byKey.get(key) ?? null;

/** The flyers a compose form sends, by key. → `{ value: [flyer] }` or `{ error }`. */
export function validateFlyers(input) {
  if (input === undefined || input === null) return { value: [] };
  if (!Array.isArray(input) || input.length > FLYERS.length) {
    return { error: 'The flyers didn’t come through. Add them again.' };
  }
  const value = [];
  for (const key of input) {
    const flyer = flyerByKey(key);
    if (!flyer) return { error: 'That flyer isn’t there anymore. Remove it and add it again.' };
    if (!value.includes(flyer)) value.push(flyer);
  }
  return { value };
}
