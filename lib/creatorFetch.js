// The driver pages' API, answered in the browser while creator mode is on
// (docs/CREATOR-MODE.md). components/creator/CreatorMode.jsx swaps it in for
// window.fetch, so the real components (the lookup card, Driver tips,
// Directions, History, Places, Covers, the profile) run unchanged on made-up
// data. Posting, editing, voting, deleting, notes and lists change the tab's
// copy (lib/creatorStore.js), so a video can show them, and nothing reaches
// the server: a reload starts over.
//
// Only same-site /api/ calls are answered. Page loads, /api/auth/ (sign out)
// and this device's notifications (turning them on or off, the test, which is
// about the device, not the account's data) go to the server as usual. Any
// other /api/ call is answered too, never sent: a read says it isn't
// available, a write says it worked, so no real data shows up and nothing
// real is written while recording.

import { setCreatorActive } from '@/lib/creatorMode';
import {
  CREATOR_AUTHOR,
  CREATOR_ROUTES,
  creatorCoverListStatus,
  creatorHistoryPage,
  creatorPlaceThread,
  creatorSlicName,
  creatorThread,
  creatorVoters,
} from '@/lib/creatorData';
import { creatorId, creatorState, updateCreator } from '@/lib/creatorStore';

// What still goes to the server.
const PASS_THROUGH = ['/api/auth/', '/api/users/me/push-subscriptions', '/api/users/me/push-test'];

// The 30 minutes in which a repeat lookup isn't a new one (recordSlicView,
// lib/db/slicViews.js).
const REPEAT_LOOKUP_WINDOW_MS = 30 * 60 * 1000;

let originalFetch = null;
let realFetch = null; // bound, since fetch throws when called off window

// A short wait, so skeletons and the "just posted" tint look as they do live.
const wait = () => new Promise((resolve) => setTimeout(resolve, 180 + Math.random() * 220));

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const now = () => new Date().toISOString();

async function readBody(input, init) {
  try {
    if (typeof init?.body === 'string') return JSON.parse(init.body);
    if (input instanceof Request) return await input.clone().json();
  } catch {
    // Not JSON.
  }
  return {};
}

// ── Comment threads (tips and place comments share the rules) ──────────────
// One level deep: a reply to a reply is filed under the thread's top comment.
// A top comment deleted while it has replies becomes a placeholder, which goes
// with its last reply. Votes toggle; null takes yours back.

function addComment(records, fields, parentId) {
  const parent = parentId ? records.find((r) => r._id === parentId) : null;
  const record = {
    ...fields,
    parentId: parent ? (parent.parentId ?? parent._id) : null,
    isMine: true,
    deleted: false,
    upCount: 0,
    downCount: 0,
    myVote: null,
    created_at: now(),
    updated_at: null,
  };
  return [...records, record];
}

function deleteComment(records, id) {
  const record = records.find((r) => r._id === id);
  if (!record.parentId && records.some((r) => r.parentId === id)) {
    return records.map((r) =>
      r._id === id ? { ...r, deleted: true, content: '', pin: null, author: null, isMine: false } : r,
    );
  }
  let next = records.filter((r) => r._id !== id);
  const top = record.parentId && next.find((r) => r._id === record.parentId);
  if (top?.deleted && !next.some((r) => r.parentId === top._id)) next = next.filter((r) => r._id !== top._id);
  return next;
}

const voteComment = (records, id, vote) =>
  records.map((r) =>
    r._id === id
      ? {
          ...r,
          upCount: r.upCount + (vote === 'up') - (r.myVote === 'up'),
          downCount: r.downCount + (vote === 'down') - (r.myVote === 'down'),
          myVote: vote,
        }
      : r,
  );

const editComment = (records, id, changes) =>
  records.map((r) => (r._id === id ? { ...r, ...changes, updated_at: now() } : r));

// GET, PATCH, DELETE and vote on one comment of `key` ('tips' or
// 'placeComments'); null when `path` isn't one.
function commentItem(key, base, path, method, body, { pin = false } = {}) {
  const match = path.match(new RegExp(`^${base}/([^/]+)(/vote|/voters)?$`));
  if (!match) return null;
  const [, id, sub] = match;
  const record = creatorState()[key].find((r) => r._id === id);
  if (!record) return json({ error: 'Comment not found' }, 404);

  if (sub === '/voters') return json(creatorVoters(record));
  if (sub === '/vote') {
    updateCreator((s) => ({ [key]: voteComment(s[key], id, body.voteType ?? null) }));
    return json({ success: true });
  }
  if (method === 'PATCH') {
    const changes = { content: String(body.content ?? '').trim() };
    if (pin && body.pin !== undefined) changes.pin = body.pin;
    updateCreator((s) => ({ [key]: editComment(s[key], id, changes) }));
    return json({ success: true });
  }
  if (method === 'DELETE') {
    updateCreator((s) => ({ [key]: deleteComment(s[key], id) }));
    return json({ success: true, message: 'Comment deleted successfully', outcome: 'deleted' });
  }
  return null;
}

// ── The routes ──────────────────────────────────────────────────────────────

function lookupTips(path, params, method, body) {
  if (path === '/api/comments' && method === 'GET') {
    const numSlic = params.get('slic');
    return json({ comments: creatorThread(creatorState().tips, numSlic), slicName: creatorSlicName(numSlic) });
  }
  if (path === '/api/comments' && method === 'POST') {
    const content = String(body.content ?? '').trim();
    if (!content && !body.pin) return json({ error: 'Write something first.' }, 400);
    const id = creatorId('c7ea7070dd');
    updateCreator((s) => ({
      tips: addComment(
        s.tips,
        { _id: id, numSlic: String(body.numSlic), author: CREATOR_AUTHOR, content, format: 'text', pin: body.pin ?? null },
        body.parentId,
      ),
    }));
    return json({ id });
  }
  return commentItem('tips', '/api/comments', path, method, body, { pin: true });
}

function lookups(path, params, method, body) {
  // The lookup counter and History: a repeat of the latest lookup within 30
  // minutes isn't a new one (recordSlicView).
  if (path === '/api/users/me/track-view') {
    const { history, viewCount } = creatorState();
    const latest = history.reduce((a, b) => (!a || b.viewedAt > a.viewedAt ? b : a), null);
    const numSlic = Number(body.numSlic);
    const repeat =
      latest?.numSlic === numSlic && Date.now() - Date.parse(latest.viewedAt) < REPEAT_LOOKUP_WINDOW_MS;
    if (repeat) return json({ slicViews: viewCount });
    const row = { id: creatorId('c7ea7070bd'), numSlic, viewedAt: now(), note: null, hidden: false };
    updateCreator((s) => ({ history: [row, ...s.history], viewCount: s.viewCount + 1 }));
    return json({ slicViews: viewCount + 1 });
  }
  if (path === '/api/users/me/history' && method === 'GET') {
    return json(creatorHistoryPage(creatorState().history, params));
  }
  const item = path.match(/^\/api\/users\/me\/history\/([^/]+)$/);
  if (item && method === 'PATCH') {
    const id = item[1];
    if (!creatorState().history.some((row) => row.id === id)) {
      return json({ error: 'History entry not found.' }, 404);
    }
    const change = 'note' in body ? { note: String(body.note ?? '').trim() || null } : { hidden: Boolean(body.hidden) };
    updateCreator((s) => ({ history: s.history.map((row) => (row.id === id ? { ...row, ...change } : row)) }));
    return json(change);
  }

  // Directions (none of the photos or PDFs are made up).
  if (path === '/api/slic-routes' && method === 'GET') {
    const numSlic = params.get('slic');
    const text = CREATOR_ROUTES[numSlic];
    return json({
      route: text ? { numSlic, text, source: null, approvedAt: new Date(Date.now() - 20 * 86400000).toISOString() } : null,
    });
  }
  if (/^\/api\/slics\/[^/]+\/documents$/.test(path)) return json({ documents: [] });
  if (path === '/api/route-suggestions' && method === 'GET') return json({ mine: null });
  return null;
}

function places(path, params, method, body) {
  if (path === '/api/place-comments' && method === 'GET') {
    return json({ comments: creatorPlaceThread(creatorState().placeComments, params.get('placeId')) });
  }
  if (path === '/api/place-comments' && method === 'POST') {
    const content = String(body.content ?? '').trim();
    if (!content) return json({ error: "Comment can't be empty." }, 400);
    const id = creatorId('c7ea7070ae');
    updateCreator((s) => ({
      placeComments: addComment(
        s.placeComments,
        { _id: id, placeId: body.placeId, author: { firstName: 'Alex', image: CREATOR_AUTHOR.image }, content },
        body.parentId,
      ),
    }));
    return json({ _id: id }, 201);
  }
  const comment = commentItem('placeComments', '/api/place-comments', path, method, body);
  if (comment) return comment;

  const fields = ({ name, categories, trailerAccess, address, phone, open24h, hours, parking, slics }) => ({
    name,
    categories,
    trailerAccess,
    address,
    phone: phone ?? '',
    open24h: Boolean(open24h),
    hours: hours ?? '',
    parking: parking ?? null,
    slics: slics ?? [],
  });
  if (path === '/api/places' && method === 'POST') {
    const id = creatorId('c7ea7070af');
    const added = { _id: id, ...fields(body), addedByMe: true, creatorName: 'Alex', created_at: now(), updated_at: null };
    const byPlace = (a, b) =>
      (a.address.state ?? '').localeCompare(b.address.state ?? '') ||
      (a.address.city ?? '').localeCompare(b.address.city ?? '') ||
      a.name.localeCompare(b.name);
    updateCreator((s) => ({ places: [...s.places, added].sort(byPlace) }));
    return json({ _id: id }, 201);
  }
  const item = path.match(/^\/api\/places\/([^/]+)$/);
  if (item && method === 'PATCH') {
    updateCreator((s) => ({
      places: s.places.map((p) => (p._id === item[1] ? { ...p, ...fields(body), updated_at: now() } : p)),
    }));
    return json({ success: true });
  }
  if (item && method === 'DELETE') {
    updateCreator((s) => ({
      places: s.places.filter((p) => p._id !== item[1]),
      placeComments: s.placeComments.filter((c) => c.placeId !== item[1]),
    }));
    return json({ success: true });
  }
  return null;
}

function covers(path, params, method, body) {
  if (path !== '/api/users/me/cover-preferences') return null;
  const { coverJobs, coverLists } = creatorState();
  const week = method === 'GET' ? params.get('week') : body.weekEnding;
  if (!coverJobs.some((job) => job.weekEnding === week)) {
    return json({ error: 'That week’s jobs aren’t posted yet.' }, 404);
  }
  const listed = (numbers) => creatorCoverListStatus(numbers, coverJobs, week);
  if (method === 'GET') {
    return json({ success: true, data: { weekEnding: week, entries: listed((coverLists[week] ?? []).map((e) => e.jobNumber)) } });
  }
  // PUT: keep only jobs the week still has, as the server does.
  const saved = listed(Array.isArray(body.jobNumbers) ? body.jobNumbers : [])
    .filter((entry) => entry.status !== 'gone')
    .map(({ jobKey, jobNumber }) => ({ jobKey, jobNumber }));
  updateCreator((s) => ({ coverLists: { ...s.coverLists, [week]: saved } }));
  return json({ success: true, data: { weekEnding: week, entries: listed(saved.map((e) => e.jobNumber)) } });
}

function profile(path, params, method, body) {
  if (/^\/api\/users\/[^/]+\/add-phone$/.test(path)) {
    const { firstName, lastName, phone } = body;
    updateCreator(() => ({ profile: { firstName, lastName, phone } }));
    return json({ success: true });
  }
  // Deleting would go on to sign out for real, so it's off.
  if (/^\/api\/users\/[^/]+$/.test(path) && method === 'DELETE') {
    return json({ error: 'Account deletion is off in creator mode.' }, 403);
  }
  return null;
}

async function answer(path, params, method, body) {
  for (const routes of [lookupTips, lookups, places, covers, profile]) {
    const response = routes(path, params, method, body);
    if (response) return response;
  }
  // Everything else: never sent to the server.
  if (method === 'GET') return json({ error: "That isn't available in creator mode." }, 404);
  return json({ success: true });
}

async function creatorFetch(input, init) {
  const url = new URL(input instanceof Request ? input.url : String(input), window.location.href);
  const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
  const ours = url.origin === window.location.origin && url.pathname.startsWith('/api/');
  if (!ours || PASS_THROUGH.some((prefix) => url.pathname.startsWith(prefix))) return realFetch(input, init);

  const body = method === 'GET' ? {} : await readBody(input, init);
  await wait();
  return answer(url.pathname, url.searchParams, method, body);
}

// Idempotent. The made-up data lives on in lib/creatorStore.js until a reload.
export function installCreatorFetch() {
  if (realFetch || typeof window === 'undefined') return;
  originalFetch = window.fetch;
  realFetch = originalFetch.bind(window);
  window.fetch = creatorFetch;
  setCreatorActive(true);
}

export function uninstallCreatorFetch() {
  if (!realFetch) return;
  window.fetch = originalFetch;
  originalFetch = null;
  realFetch = null;
  setCreatorActive(false);
}
