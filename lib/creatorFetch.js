// The lookup screen's API, answered in the browser while creator mode is on
// (docs/CREATOR-MODE.md). components/creator/CreatorMode.jsx swaps it in for
// window.fetch, so the real components (the card, Driver tips, Directions)
// run unchanged on made-up data from lib/creatorData.js. Posting, editing,
// voting and deleting work on a copy in memory, so a video can show them, and
// nothing reaches the server: a reload starts over.
//
// Only same-site /api/ calls are answered. Page navigations and /api/auth/
// (sign out) go to the server as usual. Any other /api/ call is answered too,
// never sent: a read says it isn't available, a write says it worked, so no
// real data shows up and nothing real is written while recording.

import { setCreatorActive } from '@/lib/creatorMode';
import {
  CREATOR_ROUTES,
  CREATOR_AUTHOR,
  CREATOR_VIEW_COUNT,
  creatorSlicName,
  creatorThread,
  creatorTips,
  creatorVoters,
} from '@/lib/creatorData';

let originalFetch = null;
let realFetch = null; // bound, since fetch throws when called off window
let tips = [];
let viewCount = CREATOR_VIEW_COUNT;
let lastViewed = null;
let nextId = 1;

// A short wait, so skeletons and the "just posted" tint look as they do live.
const wait = () => new Promise((resolve) => setTimeout(resolve, 180 + Math.random() * 220));

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const findTip = (id) => tips.find((tip) => tip._id === id);

async function readBody(input, init) {
  try {
    if (typeof init?.body === 'string') return JSON.parse(init.body);
    if (input instanceof Request) return await input.clone().json();
  } catch {
    // Not JSON.
  }
  return {};
}

async function answer(path, params, method, body) {
  // GET /api/comments?slic= → the thread
  if (path === '/api/comments' && method === 'GET') {
    const numSlic = params.get('slic');
    return json({ comments: creatorThread(tips, numSlic), slicName: creatorSlicName(numSlic) });
  }

  // POST /api/comments → a tip or reply, filed under the thread's top tip
  if (path === '/api/comments' && method === 'POST') {
    const content = String(body.content ?? '').trim();
    if (!content && !body.pin) return json({ error: 'Write something first.' }, 400);
    const parent = body.parentId ? findTip(body.parentId) : null;
    const tip = {
      _id: `c7ea7070dd00000000${String(nextId++).padStart(6, '0')}`,
      numSlic: String(body.numSlic),
      parentId: parent ? (parent.parentId ?? parent._id) : null,
      author: CREATOR_AUTHOR,
      isMine: true,
      content,
      format: 'text',
      deleted: false,
      pin: body.pin ?? null,
      upCount: 0,
      downCount: 0,
      myVote: null,
      created_at: new Date().toISOString(),
      updated_at: null,
    };
    tips.push(tip);
    return json({ id: tip._id, threadId: tip.parentId ?? tip._id });
  }

  const comment = path.match(/^\/api\/comments\/([^/]+)(\/vote|\/voters)?$/);
  if (comment) {
    const [, id, sub] = comment;
    const tip = findTip(id);
    if (!tip) return json({ error: 'Comment not found' }, 404);

    if (sub === '/voters') return json(creatorVoters(tip));

    if (sub === '/vote') {
      const next = body.voteType ?? null;
      tip.upCount += (next === 'up') - (tip.myVote === 'up');
      tip.downCount += (next === 'down') - (tip.myVote === 'down');
      tip.myVote = next;
      return json({ success: true });
    }

    if (method === 'PATCH') {
      tip.content = String(body.content ?? '').trim();
      if (body.pin !== undefined) tip.pin = body.pin;
      tip.updated_at = new Date().toISOString();
      return json({ success: true });
    }

    if (method === 'DELETE') {
      const hasReplies = tips.some((reply) => reply.parentId === id);
      if (!tip.parentId && hasReplies) {
        Object.assign(tip, { deleted: true, content: '', pin: null, author: null, isMine: false });
      } else {
        tips = tips.filter((t) => t._id !== id);
        // The placeholder goes with its last reply.
        const top = tip.parentId && findTip(tip.parentId);
        if (top?.deleted && !tips.some((reply) => reply.parentId === top._id)) {
          tips = tips.filter((t) => t._id !== top._id);
        }
      }
      return json({ message: 'Comment deleted successfully', outcome: 'deleted' });
    }
  }

  // The lookup counter, which skips a repeat of the last lookup like the server.
  if (path === '/api/users/me/track-view') {
    if (body.numSlic !== lastViewed) viewCount += 1;
    lastViewed = body.numSlic;
    return json({ slicViews: viewCount });
  }

  if (path === '/api/slic-routes' && method === 'GET') {
    const numSlic = params.get('slic');
    const text = CREATOR_ROUTES[numSlic];
    return json({
      route: text ? { numSlic, text, source: null, approvedAt: new Date(Date.now() - 20 * 86400000).toISOString() } : null,
    });
  }

  if (/^\/api\/slics\/[^/]+\/documents$/.test(path)) return json({ documents: [] });
  if (path === '/api/route-suggestions' && method === 'GET') return json({ mine: null });

  // Everything else: never sent to the server.
  if (method === 'GET') return json({ error: "That isn't available in creator mode." }, 404);
  return json({ success: true });
}

async function creatorFetch(input, init) {
  const url = new URL(input instanceof Request ? input.url : String(input), window.location.href);
  const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
  const ours = url.origin === window.location.origin && url.pathname.startsWith('/api/');
  if (!ours || url.pathname.startsWith('/api/auth/')) return realFetch(input, init);

  const body = method === 'GET' ? {} : await readBody(input, init);
  await wait();
  return answer(url.pathname, url.searchParams, method, body);
}

// Idempotent. Each install starts from fresh made-up tips.
export function installCreatorFetch() {
  if (realFetch || typeof window === 'undefined') return;
  originalFetch = window.fetch;
  realFetch = originalFetch.bind(window);
  tips = creatorTips();
  viewCount = CREATOR_VIEW_COUNT;
  lastViewed = null;
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
