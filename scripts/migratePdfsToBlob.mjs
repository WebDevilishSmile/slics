// One-off migration: copy each slic's directions PDF from the legacy public
// Supabase bucket into Vercel Blob and record the new URL on the slic.
//
//   node --env-file=.env scripts/migratePdfsToBlob.mjs --dry-run   # print the file→slic mapping, change nothing
//   node --env-file=.env scripts/migratePdfsToBlob.mjs             # copy + write pdfUrl
//
// Additive and safe to re-run:
//   - never writes to or deletes from Supabase (it only downloads)
//   - never touches the legacy `pdf` boolean
//   - skips any slic that already has a `pdfUrl`
// The reverse is scripts/rollbackPdfUrls.mjs.
//
// Imports app modules directly (ESM), so this needs Node 22.7+ (module
// syntax detection); the app's own dev machine runs 24.
import { MongoClient } from 'mongodb';
import { putSlicPdf } from '../lib/blob.js';
import { LEGACY_PDF_BASE_URL } from '../utils/variables.js';

// Snapshot of the bucket's contents (formerly utils/pdfs.js). Each name is
// `<alphaSlic>.pdf`, lowercased.
const LEGACY_PDF_FILES = [
  '0703.pdf',
  '1110.pdf',
  'albny.pdf',
  'balmd.pdf',
  'bbrnj.pdf',
  'bomd.pdf',
  'bruny.pdf',
  'burmd.pdf',
  'chrde.pdf',
  'crbnj.pdf',
  'crhct.pdf',
  'crlpa.pdf',
  'cronj.pdf',
  'edinj.pdf',
  'elmny.pdf',
  'ewr55.pdf',
  'ezrpa.pdf',
  'fosny.pdf',
  'gaimd.pdf',
  'harct.pdf',
  'harpa.pdf',
  'hbgrr.pdf',
  'hompa.pdf',
  'hvamd.pdf',
  'islny.pdf',
  'laknj.pdf',
  'lanpa.pdf',
  'lawnj.pdf',
  'm43ny.pdf',
  'manno.pdf',
  'manny.pdf',
  'mdtas.pdf',
  'meanj.pdf',
  'melny.pdf',
  'molnj.pdf',
  'mouny.pdf',
  'mquny.pdf',
  'mtlpa.pdf',
  'nasny.pdf',
  'newpa.pdf',
  'nobg.pdf',
  'nwcde.pdf',
  'nwtva.pdf',
  'orepa.pdf',
  'parnj.pdf',
  'pghrr.pdf',
  'phlpa.pdf',
  'plenj.pdf',
  'potpa.pdf',
  'reapa.pdf',
  'rutpa.pdf',
  'sadnj.pdf',
  'scrpa.pdf',
  'stava.pdf',
  'strct.pdf',
  'strpa.pdf',
  'syrny.pdf',
  'trenj.pdf',
  'vinnj.pdf',
  'watct.pdf',
  'wbapa.pdf',
  'wchpa.pdf',
  'wilpa.pdf',
  'worma.pdf',
  'yorny.pdf',
];

const dryRun = process.argv.includes('--dry-run');

function baseName(filename) {
  return filename.replace(/\.pdf$/i, '').toLowerCase();
}

async function downloadLegacyPdf(filename) {
  const res = await fetch(`${LEGACY_PDF_BASE_URL}/${filename}`);
  // Supabase answers a missing object with a JSON error body, so check the
  // type as well as the status.
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok || contentType.includes('application/json')) {
    return null;
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }
  if (!dryRun && !process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      'Invalid/Missing environment variable: "BLOB_READ_WRITE_TOKEN" (connect a Blob store to the Vercel project, then `vercel env pull`)'
    );
  }

  console.log(dryRun ? 'DRY RUN — nothing will be uploaded or written.\n' : '');

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const slicsCollection = client.db().collection('slics');

    const slics = await slicsCollection
      .find({}, { projection: { numSlic: 1, alphaSlic: 1, pdf: 1, pdfUrl: 1 } })
      .toArray();

    const byAlpha = new Map();
    for (const slic of slics) {
      if (slic.alphaSlic) {
        byAlpha.set(String(slic.alphaSlic).toLowerCase(), slic);
      }
    }

    const summary = {
      uploaded: [],
      skipped: [],
      unmatched: [],
      missing: [],
      failed: [],
    };

    for (const filename of LEGACY_PDF_FILES) {
      const slic = byAlpha.get(baseName(filename));

      if (!slic) {
        console.log(`UNMATCHED  ${filename} — no slic with that alphaSlic`);
        summary.unmatched.push(filename);
        continue;
      }

      const label = `${filename} → numSlic ${slic.numSlic} (${slic.alphaSlic})`;

      if (slic.pdfUrl) {
        console.log(`SKIP       ${label} — already has pdfUrl`);
        summary.skipped.push(filename);
        continue;
      }

      if (dryRun) {
        console.log(`WOULD COPY ${label}`);
        summary.uploaded.push(filename);
        continue;
      }

      const body = await downloadLegacyPdf(filename);
      if (!body) {
        console.log(`MISSING    ${label} — not found in the Supabase bucket`);
        summary.missing.push(filename);
        continue;
      }

      try {
        const { url } = await putSlicPdf(slic.alphaSlic, body);
        await slicsCollection.updateOne(
          { _id: slic._id },
          { $set: { pdfUrl: url } }
        );
        console.log(`COPIED     ${label}\n           → ${url}`);
        summary.uploaded.push(filename);
      } catch (error) {
        console.error(`FAILED     ${label}:`, error.message);
        summary.failed.push(filename);
      }
    }

    // Slics that claim a PDF but have no file in the bucket snapshot: their
    // "View PDF" button was already a dead link. Listed for manual follow-up.
    const fileBases = new Set(LEGACY_PDF_FILES.map(baseName));
    const flaggedWithoutFile = slics.filter(
      (slic) =>
        slic.pdf === true &&
        !slic.pdfUrl &&
        !fileBases.has(String(slic.alphaSlic || '').toLowerCase())
    );

    console.log('\nSummary');
    console.log(`  ${dryRun ? 'would copy' : 'copied'}: ${summary.uploaded.length}`);
    console.log(`  skipped (already migrated): ${summary.skipped.length}`);
    console.log(`  unmatched files: ${summary.unmatched.length}${summary.unmatched.length ? ' — ' + summary.unmatched.join(', ') : ''}`);
    console.log(`  missing in bucket: ${summary.missing.length}${summary.missing.length ? ' — ' + summary.missing.join(', ') : ''}`);
    console.log(`  failed: ${summary.failed.length}${summary.failed.length ? ' — ' + summary.failed.join(', ') : ''}`);
    console.log(
      `  slics flagged pdf:true with no file in the bucket: ${flaggedWithoutFile.length}` +
        (flaggedWithoutFile.length
          ? ' — ' +
            flaggedWithoutFile
              .map((s) => `${s.numSlic} (${s.alphaSlic})`)
              .join(', ')
          : '')
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Error migrating slic PDFs:', error);
  process.exit(1);
});
