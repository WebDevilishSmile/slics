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

    // The list lives in lib/db/indexSpecs.mjs, shared with the health page.
    const { INDEXES: indexes } = await import('../lib/db/indexSpecs.mjs');

    for (const { collection, spec, options } of indexes) {
      const name = await db.collection(collection).createIndex(spec, options);
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
