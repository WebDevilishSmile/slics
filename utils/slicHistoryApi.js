import client from '@/lib/db';

const HISTORY_COLLECTION = 'slic_history';

function serializeUserStamp(user) {
  if (!user) return null;
  return {
    id: user.id || null,
    name: user.name || null,
    email: user.email || null,
  };
}

// Shallow diff of top-level fields between the existing slic document and the incoming updates
export function diffSlicFields(existingSlic, updates) {
  const changes = [];

  for (const field of Object.keys(updates)) {
    if (field === 'updated_at' || field === 'updatedBy') continue;

    const from = existingSlic?.[field] ?? null;
    const to = updates[field] ?? null;

    if (JSON.stringify(from) !== JSON.stringify(to)) {
      changes.push({ field, from, to });
    }
  }

  return changes;
}

// Best-effort history logging: failures here must never block a slic create/update
export async function addSlicHistoryEntry({ slicId, numSlic, action, changes, user }) {
  try {
    const db = client.db();
    const historyCollection = db.collection(HISTORY_COLLECTION);

    await historyCollection.insertOne({
      slicId,
      numSlic,
      action,
      changes: changes || [],
      user: serializeUserStamp(user),
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error adding slic history entry:', error);
  }
}

export async function getSlicHistory(numSlic) {
  try {
    if (!numSlic) {
      throw new Error('numSlic is required');
    }

    const db = client.db();
    const historyCollection = db.collection(HISTORY_COLLECTION);
    const history = await historyCollection
      .find({ numSlic })
      .sort({ timestamp: -1 })
      .toArray();

    return history;
  } catch (error) {
    console.error('Error fetching slic history:', error);
    throw error;
  }
}
