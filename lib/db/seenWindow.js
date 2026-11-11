// The oldest and newest `seenAt` (ISO) of a change log's rows matching
// `filter`: how long a burst of sheet edits has been going and when it last
// moved, for the admin sheet digests (lib/sheetNotices.js). Two indexed reads
// of one row each. → { oldest, newest }, both null when nothing matches.
export async function seenWindow(collection, filter) {
  const edge = async (direction) => {
    const [row] = await collection
      .find(filter, { projection: { seenAt: 1 } })
      .sort({ seenAt: direction })
      .limit(1)
      .toArray();
    return row?.seenAt ?? null;
  };
  const oldest = await edge(1);
  if (!oldest) return { oldest: null, newest: null };
  return { oldest, newest: await edge(-1) };
}
