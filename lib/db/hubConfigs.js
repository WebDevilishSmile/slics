import { unstable_cache } from 'next/cache';

import client from '@/lib/db/client';
import { DEFAULT_HUB_ID, assertHubId, hubConfigFrom } from '@/lib/hubScope';

// Each hub's settings (docs/MULTI-HUB.md, stage 0). One doc per hub in
// `hub-configs`:
//   { _id: 'betpa', name, alphaSlic, numSlic, dispatchNumSlic, timeZone,
//     covers: { enabled, layout, coverDriverCount, bidDayOffsetDays, sleeperPattern },
//     sheet: { id, webhookSecretHash }, seededAt, seededBy, updatedAt }
// lib/hubScope.js (hubConfigFrom) shapes it, and BETPA's missing doc or field
// is the code's value, so deleting the doc is the rollback. Written only by
// scripts/seedHubConfig.mjs until the super admin's hubs page (stage 3).
//
// `sheet` stays on the server: the on-call sheet's id (kept out of git) and
// the SHA-256 of its webhook secret. BETPA's falls back to ON_CALL_SHEET_ID
// and ON_CALL_SHEET_WEBHOOK_SECRET, so the env keys keep working until the
// doc has them, and win nothing once it does. Pass a hub to a browser only
// through publicHub (lib/hubScope.js).

const HUB_CONFIG_TTL_SECONDS = 300;
export const HUB_CONFIG_TAG = 'hub-configs';
const configs = () => client.db().collection('hub-configs');

// The doc as stored, minus anything that isn't a setting. No env values, so
// nothing from the environment lands in the shared cache.
async function readStored(hubId) {
  const doc = await configs().findOne({ _id: hubId });
  if (!doc) return null;
  return {
    ...hubConfigFrom(hubId, doc),
    storedSheet: {
      id: typeof doc.sheet?.id === 'string' && doc.sheet.id ? doc.sheet.id : null,
      webhookSecretHash:
        typeof doc.sheet?.webhookSecretHash === 'string' && /^[0-9a-f]{64}$/.test(doc.sheet.webhookSecretHash)
          ? doc.sheet.webhookSecretHash
          : null,
    },
  };
}

const cachedStored = unstable_cache(readStored, [HUB_CONFIG_TAG], {
  tags: [HUB_CONFIG_TAG],
  revalidate: HUB_CONFIG_TTL_SECONDS,
});

// The stored settings plus `sheet`, with BETPA's env fallbacks. → null for a
// hub that has no doc (only BETPA works without one).
function withSheet(hubId, stored) {
  if (!stored && hubId !== DEFAULT_HUB_ID) return null;
  const { storedSheet, ...hub } = stored ?? hubConfigFrom(hubId, null);
  const isDefault = hubId === DEFAULT_HUB_ID;
  return {
    ...hub,
    sheet: {
      id: storedSheet?.id ?? (isDefault ? process.env.ON_CALL_SHEET_ID || null : null),
      // Exactly one of these is set when the hub has a webhook: the stored
      // hash wins over the env secret.
      webhookSecretHash: storedSheet?.webhookSecretHash ?? null,
      webhookSecret: storedSheet?.webhookSecretHash
        ? null
        : isDefault
          ? process.env.ON_CALL_SHEET_WEBHOOK_SECRET || null
          : null,
      source: storedSheet?.id ? 'hub-configs' : isDefault && process.env.ON_CALL_SHEET_ID ? 'env' : null,
    },
  };
}

// A hub's settings, cached for five minutes. BETPA's never throws: a failed
// read is the code's values with the env keys, as before hub-configs existed.
// Another hub's failed read throws, and a hub with no doc is null.
export async function getHubConfig(hubId = DEFAULT_HUB_ID) {
  assertHubId(hubId);
  try {
    return withSheet(hubId, await cachedStored(hubId));
  } catch (error) {
    if (hubId !== DEFAULT_HUB_ID) throw error;
    console.error('Error reading the hub config; using the defaults:', error);
    return withSheet(hubId, null);
  }
}

// Past the cache, for the super admin's pages and scripts loaded through jiti.
export async function getHubConfigFresh(hubId = DEFAULT_HUB_ID) {
  assertHubId(hubId);
  return withSheet(hubId, await readStored(hubId));
}

// Whether a hub's settings come from a saved doc or only from the code, for
// the health page. Never the sheet's id or hash.
export async function describeHubConfig(hubId = DEFAULT_HUB_ID) {
  assertHubId(hubId);
  const doc = await configs().findOne({ _id: hubId }, { projection: { sheet: 1, seededAt: 1, updatedAt: 1 } });
  return {
    saved: Boolean(doc),
    sheetIdSaved: Boolean(doc?.sheet?.id),
    webhookHashSaved: Boolean(doc?.sheet?.webhookSecretHash),
    updatedAt: doc?.updatedAt ?? doc?.seededAt ?? null,
  };
}
