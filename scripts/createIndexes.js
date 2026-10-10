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
      // A week's picks and pick changes from the on-call sheet
      // (docs/ON-CALL-SHEET-SYNC.md).
      { collection: 'cover-bid-picks', spec: { weekEnding: 1 }, options: { unique: true } },
      { collection: 'cover-bid-pick-events', spec: { weekEnding: 1, seenAt: -1 } },
      // The sheet's Jobs tab and its change history.
      { collection: 'sheet-jobs', spec: { jobName: 1 }, options: { unique: true } },
      { collection: 'sheet-job-changes', spec: { seenAt: -1 } },
      { collection: 'sheet-job-changes', spec: { jobName: 1, seenAt: -1 } },
      // The $lookup in gymsApi.getAllGyms joins comments by gymId.
      { collection: 'gymComments', spec: { gymId: 1, created_at: -1 } },
      // A place's thread (placesApi.getPlaceThread) and the reply counts behind
      // the soft-delete rule; userId backs account deletion's cleanup.
      { collection: 'placeComments', spec: { placeId: 1, parentId: 1 } },
      { collection: 'placeComments', spec: { userId: 1 } },
      // Buy Me a Coffee deliveries (docs/BMC-SUPPORT.md). The unique key (a hash
      // of the body) makes a retried or replayed delivery a no-op.
      { collection: 'bmc-events', spec: { key: 1 }, options: { unique: true } },
      { collection: 'bmc-events', spec: { receivedAt: -1 } },
      { collection: 'bmc-events', spec: { userId: 1, receivedAt: -1 } },
    ];

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
