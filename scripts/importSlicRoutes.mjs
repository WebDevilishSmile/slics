// Imports each SLIC's directions PDF as a route in text (docs/SLIC-DIRECTIONS.md,
// stage 1), so drivers read numbered steps instead of opening the PDF.
//
//   npm run routes:import -- --dev --dry-run          # what it would import into the dev copy
//   npm run routes:import -- --dev                     # import into the dev copy (DEV_MONGODB_URI)
//   npm run routes:import -- --dry-run --out=<file>    # production, read-only; every route text to <file>
//   npm run routes:import                              # import into production
//   npm run routes:import -- --undo [--dev]            # take back imported routes nobody has edited
//   add --only=HARCT,WORMA to limit it to some SLICs
//
// It reads the PDF's text (unpdf), drops the header lines that repeat the
// SLIC's record (alpha, number, name, address, phone: the app's record is the
// one source now), keeps "Way 2:"-style titles as section headings, rejoins
// the lines the PDF wrapped, and puts one sentence per line, one step each.
// The words stay as the PDF has them. An admin goes over each route on the
// edit page (ROUTE-REVIEW.md lists what to check), and saving there makes it
// "Driver-approved"; until then drivers see "From the original directions PDF".
//
// Additive: a SLIC that already has a route is skipped, the PDFs and pdfUrl
// are untouched, and --undo deletes only routes it imported that nobody has
// saved since (and the history lines it wrote). Each run goes to admin_audit
// first, counts only.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { MongoClient } from 'mongodb';

import { DEFAULT_HUB_ID } from '../lib/hubScope.js';
import { mentionsCode, parseRoute, validateRouteText } from '../lib/routeText.js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const UNDO = args.includes('--undo');
const DEV = args.includes('--dev');
const ONLY = (args.find((arg) => arg.startsWith('--only='))?.slice(7) ?? '')
  .split(',')
  .map((alpha) => alpha.trim().toUpperCase())
  .filter(Boolean);
const OUT = args.find((arg) => arg.startsWith('--out='))?.slice(6) ?? null;
const SCRIPT = 'scripts/importSlicRoutes.mjs';
const ROUTES = 'slic-routes';

// --- Turning a PDF's text into route text (pure) ---

const PHONE = /\(?\d{3}\)?[\s.-]*\d{3}[\s.-]\d{4}/;
const STATE_ZIP = /\b[A-Z]{2}\.?,?\s*\d{5}\b/;
const ends = (line, chars) => chars.includes(line.at(-1));

// A line of the PDF's header (the part that repeats the SLIC's record). The
// header ends at the first line that isn't one, so a phone number in the
// route itself is never touched.
function isHeaderLine(line, slic) {
  if (line.endsWith(':')) return false;
  const upper = line.toUpperCase();
  const alpha = String(slic.alphaSlic ?? '').toUpperCase();
  if (alpha && upper.includes(alpha)) return true;
  if (new RegExp(`^\\W*${slic.numSlic}\\b`).test(line)) return true;
  if (PHONE.test(line) || STATE_ZIP.test(line)) return true;
  // A street address ("4910 27th Street", "16E Chimney Rock Road", "2110 North
  // Union Street"): a number, then a name, short. A route line has a "to" in
  // it ("33 south to 78 east"); an address doesn't.
  if (/^\d[\dA-Za-z-]*\s+\S/.test(line) && line.length <= 45 && !/\bto\b/i.test(line)) return true;
  // The place's name ("UPS Worcester", "CSX Baltimore Railyard", "BROOKLYN,
  // NY"): short, no digits, and not a way's title.
  if (!/\d/.test(line) && line.length <= 50 && !/\b(way|route|from|to)\b/i.test(line)) return true;
  return false;
}

// A section title written without a colon ("George Washington Bridge Way",
// "Way 1", "The Way Back"): short, after a finished sentence, not one itself,
// and about a way.
function isUntitledHeading(line, previous) {
  if (line.length > 80 || ends(line, '.,')) return false;
  if (previous && !ends(previous, '.!*)')) return false;
  return /\bway\b/i.test(line) || /^(leaving|from|route (to|back))\b/i.test(line);
}

// Words that end in a period without ending a sentence.
const ABBREVIATIONS = new Set(
  'rd ave st dr rt rte blvd pkwy ln mt ft pt jr sr no n s e w expy expwy hwy pl ct cir twp tpke approx vs etc u.s'.split(' '),
);

// A step usually opens with one of these, so after an abbreviation that ends
// a sentence too ("Caton Ave. The ramp splits") they still start a new step.
const STEP_OPENERS = new Set(
  'the follow take make turn stay go at once continue ups use bear bare keep cross in next first second third this then drive if you when head pull enter proceed get after just there it look wait exit merge left right from on drop check'.split(
    ' ',
  ),
);

// One sentence per step: split after . ! or ? (after a road abbreviation only
// when a step opener follows), and at the "..." some routes use between steps.
function sentences(paragraph) {
  // "..." or "…", with any dots after it ("center.... Follow"), except inside
  // brackets, where it's a pause: "(a UPS facility on your right... not the
  // one you want)" stays one step.
  const pieces = paragraph.split(/(?:\.{3,}|…)\.*\s*/).map((part) => part.trim());
  const parts = [];
  for (const piece of pieces) {
    const last = parts.at(-1);
    const open = last ? (last.match(/\(/g) ?? []).length - (last.match(/\)/g) ?? []).length : 0;
    if (open > 0) parts[parts.length - 1] = `${last}… ${piece}`;
    else parts.push(piece);
  }
  for (let i = parts.length - 1; i >= 0; i -= 1) if (!/[A-Za-z0-9]/.test(parts[i])) parts.splice(i, 1);
  const out = [];
  for (const part of parts) {
    let start = 0;
    const boundary = /([.!?])\s+(?=[A-Z0-9(*"'])/g;
    let match;
    while ((match = boundary.exec(part))) {
      const before = part.slice(start, match.index);
      const word = before.split(/\s+/).at(-1)?.replace(/[^A-Za-z.]/g, '').toLowerCase() ?? '';
      const after = part.slice(match.index + match[0].length).match(/^[A-Za-z]+/)?.[0]?.toLowerCase();
      if (match[1] === '.' && ABBREVIATIONS.has(word) && !STEP_OPENERS.has(after)) continue;
      out.push(part.slice(start, match.index + 1).trim());
      start = match.index + match[0].length;
    }
    out.push(part.slice(start).trim());
  }
  return out.filter(Boolean);
}

export function toRouteText(raw, slic) {
  const lines = String(raw)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  let first = 0;
  while (first < lines.length && isHeaderLine(lines[first], slic)) first += 1;
  const dropped = first;

  const out = [];
  let paragraph = [];
  const flush = () => {
    if (paragraph.length) out.push(...sentences(paragraph.join(' ')));
    paragraph = [];
  };
  let previous = null;
  for (const line of lines.slice(first)) {
    if (line.endsWith(':') && line.length <= 80) {
      flush();
      out.push(line);
    } else if (isUntitledHeading(line, previous)) {
      flush();
      out.push(`${line}:`);
    } else {
      paragraph.push(line);
    }
    previous = line;
  }
  flush();
  return { text: out.join('\n'), dropped };
}

// --- The run ---

function target() {
  const uri = DEV ? process.env.DEV_MONGODB_URI : process.env.MONGODB_URI;
  if (!uri) throw new Error(`${DEV ? 'DEV_MONGODB_URI' : 'MONGODB_URI'} is not set.`);
  return uri;
}

async function loadUnpdf() {
  // Resolved from the repo, like the app's own packages.
  const require = createRequire(import.meta.url);
  return import(pathToFileURL(require.resolve('unpdf')).href);
}

async function readPdf(url, unpdf) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`download failed (${response.status})`);
  const pdf = await unpdf.getDocumentProxy(new Uint8Array(await response.arrayBuffer()));
  const { text } = await unpdf.extractText(pdf, { mergePages: true });
  return text;
}

async function undo(db) {
  const routes = db.collection(ROUTES);
  const filter = {
    hubId: DEFAULT_HUB_ID,
    source: 'pdf-import',
    previous: { $size: 0 },
    ...(ONLY.length ? { importedAlpha: { $in: ONLY } } : {}),
  };
  const rows = await routes.find(filter, { projection: { numSlic: 1 } }).toArray();
  console.log(`--undo would delete ${rows.length} imported routes nobody has saved since.`);
  if (DRY_RUN || rows.length === 0) return;
  const numSlics = rows.map((row) => row.numSlic);
  await db.collection('admin_audit').insertOne({
    actorId: null,
    actorName: SCRIPT,
    action: 'routes.importUndone',
    targetType: 'hub',
    targetId: DEFAULT_HUB_ID,
    targetName: null,
    from: { routes: rows.length },
    to: null,
    at: new Date(),
  });
  await routes.deleteMany({ _id: { $in: rows.map((row) => row._id) } });
  const history = await db.collection('slic_history').deleteMany({
    numSlic: { $in: numSlics },
    'user.name': SCRIPT,
    'changes.field': 'route',
  });
  console.log(`Deleted ${rows.length} routes and ${history.deletedCount} history lines.`);
}

async function main() {
  const client = new MongoClient(target());
  await client.connect();
  const db = client.db();
  console.log(`${DEV ? 'Dev copy' : 'PRODUCTION'} (database "${db.databaseName}")${DRY_RUN ? ', dry run' : ''}.`);
  if (DEV && !db.databaseName.includes('dev')) {
    throw new Error(`--dev expects a database whose name contains "dev", not "${db.databaseName}".`);
  }

  try {
    if (UNDO) return await undo(db);

    const unpdf = await loadUnpdf();
    const slics = await db
      .collection('slics')
      .find(
        { pdfUrl: { $nin: [null, ''] } },
        { projection: { numSlic: 1, alphaSlic: 1, name: 1, phone: 1, address: 1, pdfUrl: 1 } },
      )
      .sort({ alphaSlic: 1 })
      .toArray();
    const existing = new Set(
      (await db.collection(ROUTES).find({ hubId: DEFAULT_HUB_ID }, { projection: { numSlic: 1 } }).toArray()).map(
        (row) => String(row.numSlic),
      ),
    );

    const imports = [];
    const report = [];
    for (const slic of slics) {
      const alpha = String(slic.alphaSlic ?? '').toUpperCase();
      if (ONLY.length && !ONLY.includes(alpha)) continue;
      if (existing.has(String(slic.numSlic))) {
        report.push(`  ${alpha.padEnd(6)} skipped: already has a route`);
        continue;
      }
      try {
        const raw = await readPdf(slic.pdfUrl, unpdf);
        if (!raw.trim()) {
          report.push(`  ${alpha.padEnd(6)} NO TEXT (a scan?): type it in by hand`);
          continue;
        }
        const { text: built, dropped } = toRouteText(raw, slic);
        const { text, error } = validateRouteText(built);
        if (error) {
          report.push(`  ${alpha.padEnd(6)} NOT IMPORTED: ${error}`);
          continue;
        }
        const sections = parseRoute(text);
        const steps = sections.reduce((sum, section) => sum + section.steps.length, 0);
        report.push(
          `  ${alpha.padEnd(6)} ${String(steps).padStart(3)} steps, ${sections.length} section${
            sections.length === 1 ? ' ' : 's'
          }, ${dropped} header lines dropped${mentionsCode(text) ? ', MENTIONS A CODE' : ''}`,
        );
        imports.push({ slic, alpha, text });
      } catch (error) {
        report.push(`  ${alpha.padEnd(6)} FAILED: ${error.message}`);
      }
    }
    console.log(report.join('\n'));
    console.log(`${imports.length} to import, of ${slics.length} SLICs with a PDF.`);

    if (OUT) {
      fs.writeFileSync(OUT, imports.map(({ alpha, slic, text }) => `=== ${alpha} ${slic.numSlic}\n${text}\n`).join('\n'));
      console.log(`Every route's text is in ${OUT}.`);
    }
    if (DRY_RUN || imports.length === 0) return;

    const at = new Date();
    const now = at.toISOString();
    await db.collection('admin_audit').insertOne({
      actorId: null,
      actorName: SCRIPT,
      action: 'routes.imported',
      targetType: 'hub',
      targetId: DEFAULT_HUB_ID,
      targetName: null,
      from: null,
      to: { routes: imports.length },
      at,
    });
    // The unique index the app relies on (lib/db/indexSpecs.mjs), so a second
    // run can never add a second route for a SLIC.
    await db.collection(ROUTES).createIndex({ hubId: 1, numSlic: 1 }, { unique: true });
    await db.collection(ROUTES).insertMany(
      imports.map(({ slic, alpha, text }) => ({
        hubId: DEFAULT_HUB_ID,
        numSlic: String(slic.numSlic),
        text,
        source: 'pdf-import',
        importedFrom: slic.pdfUrl,
        importedAlpha: alpha,
        approvedBy: null,
        approvedAt: now,
        created_at: now,
        updated_at: now,
        previous: [],
      })),
    );
    await db.collection('slic_history').insertMany(
      imports.map(({ slic, text }) => ({
        slicId: slic._id,
        numSlic: String(slic.numSlic),
        action: 'updated',
        changes: [{ field: 'route', from: null, to: text }],
        user: { id: null, name: SCRIPT, email: null },
        timestamp: at,
      })),
    );
    console.log(`Imported ${imports.length} routes.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
