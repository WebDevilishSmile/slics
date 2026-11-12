// Writes BETPA's `hub-configs` doc from the code's values (DEFAULT_HUB,
// lib/hubScope.js), so its settings live in the database (docs/MULTI-HUB.md,
// stage 0). The app reads the same values with or without the doc, so seeding
// changes nothing drivers see; deleting the doc (--undo) is the rollback.
//
//   npm run hub:seed -- --dry-run                 # show what it would write, change nothing
//   npm run hub:seed                              # write the doc, if there isn't one
//   npm run hub:seed -- --with-sheet --dry-run    # also show whether the sheet would move in
//   npm run hub:seed -- --with-sheet              # also copy ON_CALL_SHEET_ID and the SHA-256 of
//                                                 # ON_CALL_SHEET_WEBHOOK_SECRET into `sheet`
//   npm run hub:seed -- --undo                    # delete the doc, only if this script wrote it
//
// --with-sheet is a choice, not the default: once `sheet` is saved it wins over
// the env keys, so rotating the webhook secret means re-seeding (OPERATIONS.md).
// The sheet's id and the secret are never printed. Each change is written to
// `admin_audit` first, with no actor. The app caches the doc for up to five
// minutes. Run it on the dev database first (DEV-DATABASE.md).
import crypto from 'node:crypto';
import { MongoClient } from 'mongodb';

import { DEFAULT_HUB, DEFAULT_HUB_ID } from '../lib/hubScope.js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const UNDO = args.includes('--undo');
const WITH_SHEET = args.includes('--with-sheet');
const SCRIPT = 'scripts/seedHubConfig.mjs';

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

function sheetFromEnv() {
  const id = process.env.ON_CALL_SHEET_ID;
  const secret = process.env.ON_CALL_SHEET_WEBHOOK_SECRET;
  if (!id || !secret) throw new Error('--with-sheet needs ON_CALL_SHEET_ID and ON_CALL_SHEET_WEBHOOK_SECRET.');
  return { id, webhookSecretHash: sha256(secret) };
}

const audit = (db, action, to) =>
  db.collection('admin_audit').insertOne({
    actorId: null,
    actorName: SCRIPT,
    action,
    targetType: 'hub',
    targetId: DEFAULT_HUB_ID,
    targetName: DEFAULT_HUB.name,
    from: null,
    to,
    at: new Date(),
  });

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set.');
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  const configs = db.collection('hub-configs');

  try {
    const existing = await configs.findOne({ _id: DEFAULT_HUB_ID });

    if (UNDO) {
      if (!existing) return console.log('No hub-configs doc for betpa. Nothing to undo.');
      if (existing.seededBy !== SCRIPT) {
        throw new Error("The betpa doc wasn't written by this script; leaving it alone.");
      }
      console.log(`Would delete the betpa doc (seeded ${existing.seededAt?.toISOString?.() ?? '?'}${existing.sheet ? ', with its sheet' : ''}).`);
      if (DRY_RUN) return;
      await audit(db, 'hubConfig.removed', null);
      await configs.deleteOne({ _id: DEFAULT_HUB_ID, seededBy: SCRIPT });
      return console.log('Deleted. The app uses the code and env values again within five minutes.');
    }

    const { id, ...settings } = DEFAULT_HUB;
    if (existing) {
      console.log(`betpa already has a hub-configs doc (${existing.seededBy ?? 'not seeded by this script'}).`);
      if (!WITH_SHEET) return console.log('Nothing written.');
      if (existing.sheet?.id || existing.sheet?.webhookSecretHash) {
        return console.log('Its sheet is already saved. Nothing written.');
      }
      const sheet = sheetFromEnv();
      console.log('Would add the sheet: its id and the hash of its webhook secret (not shown).');
      if (DRY_RUN) return;
      await audit(db, 'hubConfig.sheetSaved', 'sheet id and webhook secret hash');
      await configs.updateOne({ _id: DEFAULT_HUB_ID }, { $set: { sheet, updatedAt: new Date() } });
      return console.log('Saved. The env keys no longer decide BETPA\'s sheet once the cache turns over.');
    }

    const now = new Date();
    const doc = {
      _id: DEFAULT_HUB_ID,
      ...settings,
      covers: { ...settings.covers },
      ...(WITH_SHEET ? { sheet: sheetFromEnv() } : {}),
      seededAt: now,
      seededBy: SCRIPT,
      updatedAt: now,
    };
    const shown = { ...doc, ...(doc.sheet ? { sheet: '(id and secret hash, not shown)' } : {}) };
    console.log('Would write:');
    console.log(JSON.stringify(shown, null, 2));
    if (DRY_RUN) return;
    await audit(db, 'hubConfig.seeded', WITH_SHEET ? 'settings and sheet' : 'settings');
    await configs.insertOne(doc);
    console.log('Written. It holds the same values the app already uses.');
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
