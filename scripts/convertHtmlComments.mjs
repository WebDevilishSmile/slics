// Converts the old Tiptap HTML SLIC comments (no `format`, before 2026-10-07)
// to plain text, so nothing stored is HTML anymore (docs/SECURITY.md #2).
//
//   node --env-file=.env scripts/convertHtmlComments.mjs --dry-run   # print each before → after, change nothing
//   node --env-file=.env scripts/convertHtmlComments.mjs             # convert
//   node --env-file=.env scripts/convertHtmlComments.mjs --undo      # put the HTML back
//
// Additive: the original is kept in `content_html`, with `htmlConvertedAt`.
// --undo restores it, except on a comment edited since (its edit stays).
import { MongoClient } from 'mongodb';
import { htmlToText } from '../lib/commentText.js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const UNDO = args.includes('--undo');
const tag = DRY_RUN ? '[dry run] ' : '';

async function undo(comments) {
  const rows = await comments
    .find({ content_html: { $exists: true } }, { projection: { updated_at: 1, htmlConvertedAt: 1 } })
    .toArray();
  const edited = rows.filter(
    (row) => row.updated_at && new Date(row.updated_at) > row.htmlConvertedAt,
  );
  const restore = rows.filter((row) => !edited.includes(row));
  console.log(`${tag}${restore.length} to restore, ${edited.length} edited since (left as they are).`);
  if (DRY_RUN || restore.length === 0) return;

  const { modifiedCount } = await comments.updateMany(
    { _id: { $in: restore.map((row) => row._id) } },
    [
      { $set: { content: '$content_html' } },
      { $unset: ['format', 'content_html', 'htmlConvertedAt'] },
    ],
  );
  console.log(`Restored ${modifiedCount}.`);
}

async function convert(comments) {
  const rows = await comments
    .find({ format: { $ne: 'text' } }, { projection: { content: 1, numSlic: 1, deleted: 1 } })
    .toArray();
  const changes = rows.map((row) => ({
    row,
    text: typeof row.content === 'string' ? htmlToText(row.content) : '',
  }));

  for (const { row, text } of changes) {
    console.log(`\n--- ${row._id} (SLIC ${row.numSlic}${row.deleted ? ', deleted placeholder' : ''})`);
    console.log(`HTML: ${JSON.stringify(row.content)}`);
    console.log(`Text: ${JSON.stringify(text)}`);
  }
  const empty = changes.filter(({ row, text }) => !text && !row.deleted);
  console.log(`\n${tag}${changes.length} HTML comments to convert.`);
  if (empty.length) {
    console.log(`${empty.length} come out empty: ${empty.map(({ row }) => row._id).join(', ')}`);
  }
  if (DRY_RUN || changes.length === 0) return;

  const htmlConvertedAt = new Date();
  const { modifiedCount } = await comments.bulkWrite(
    changes.map(({ row, text }) => ({
      updateOne: {
        filter: { _id: row._id, format: { $ne: 'text' } },
        update: {
          $set: { content: text, format: 'text', content_html: row.content ?? '', htmlConvertedAt },
        },
      },
    })),
  );
  console.log(`Converted ${modifiedCount}.`);
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set.');
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const comments = client.db().collection('comments');
    await (UNDO ? undo(comments) : convert(comments));
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
