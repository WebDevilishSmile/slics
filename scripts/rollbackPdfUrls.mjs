// Reverse of scripts/migratePdfsToBlob.mjs. For every slic with a `pdfUrl`:
// if its `<alphaSlic>.pdf` still exists in the legacy Supabase bucket, set the
// legacy `pdf: true` flag and unset `pdfUrl`, so home/PdfLink.jsx serves the
// Supabase copy again. If it doesn't exist there, the PDF was uploaded through
// the new admin flow only — it's left untouched and reported so it can be
// re-uploaded to Supabase by hand before Blob is abandoned.
//
//   node --env-file=.env scripts/rollbackPdfUrls.mjs --dry-run   # report only
//   node --env-file=.env scripts/rollbackPdfUrls.mjs
//
// Never deletes blobs (delete the store from the Vercel dashboard if giving
// up on Blob). Pair with `git revert` of the Blob commit to restore the
// pre-migration app exactly.
import { MongoClient } from 'mongodb';
import { legacyPdfUrl } from '../utils/variables.js';

const dryRun = process.argv.includes('--dry-run');

async function existsInLegacyBucket(alphaSlic) {
  const res = await fetch(legacyPdfUrl(alphaSlic));
  // We only need the status; don't download the file.
  await res.body?.cancel();
  const contentType = res.headers.get('content-type') || '';
  return res.ok && !contentType.includes('application/json');
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }

  console.log(dryRun ? 'DRY RUN — nothing will be written.\n' : '');

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const slicsCollection = client.db().collection('slics');

    const migrated = await slicsCollection
      .find(
        { pdfUrl: { $type: 'string', $ne: '' } },
        { projection: { numSlic: 1, alphaSlic: 1, pdf: 1, pdfUrl: 1 } }
      )
      .toArray();

    const reverted = [];
    const blobOnly = [];

    for (const slic of migrated) {
      const label = `numSlic ${slic.numSlic} (${slic.alphaSlic})`;

      if (!slic.alphaSlic || !(await existsInLegacyBucket(slic.alphaSlic))) {
        console.log(`BLOB ONLY  ${label} — not in the Supabase bucket, left as is`);
        blobOnly.push(slic);
        continue;
      }

      if (dryRun) {
        console.log(`WOULD REVERT ${label}`);
      } else {
        await slicsCollection.updateOne(
          { _id: slic._id },
          { $set: { pdf: true }, $unset: { pdfUrl: '' } }
        );
        console.log(`REVERTED   ${label}`);
      }
      reverted.push(slic);
    }

    console.log('\nSummary');
    console.log(`  slics with pdfUrl: ${migrated.length}`);
    console.log(`  ${dryRun ? 'would revert' : 'reverted'} to Supabase: ${reverted.length}`);
    console.log(
      `  Blob-only (re-upload to Supabase by hand before removing Blob): ${blobOnly.length}` +
        (blobOnly.length
          ? '\n    ' +
            blobOnly.map((s) => `${s.numSlic} (${s.alphaSlic}) ${s.pdfUrl}`).join('\n    ')
          : '')
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Error rolling back slic PDF URLs:', error);
  process.exit(1);
});
