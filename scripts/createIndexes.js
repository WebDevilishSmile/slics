// One-off setup script. Run with: node --env-file=.env scripts/createIndexes.js
// Safe to re-run — createIndex is a no-op if an identical index already exists.
const { MongoClient } = require('mongodb');

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();

    const indexes = [
      { collection: 'users', spec: { email: 1 } },
      { collection: 'comments', spec: { numSlic: 1, upVotes: -1 } },
      { collection: 'slicViews', spec: { userId: 1, viewedAt: -1 } },
      { collection: 'slics', spec: { numSlic: 1 } },
      // Backs the six-month range scan on the cover bid jobs page and, as a
      // prefix, the single-week equality match used by the admin manager.
      { collection: 'cover-bid-jobs', spec: { weekEnding: -1, sortOrder: 1 } },
    ];

    for (const { collection, spec } of indexes) {
      const name = await db.collection(collection).createIndex(spec);
      console.log(`Created index "${name}" on "${collection}"`);
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Error creating indexes:', error);
  process.exit(1);
});
