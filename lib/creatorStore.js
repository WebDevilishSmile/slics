'use client';

import { useSyncExternalStore } from 'react';

import {
  CREATOR_VIEW_COUNT,
  creatorCoverJobs,
  creatorCovers,
  creatorHistory,
  creatorPlaceComments,
  creatorPlaces,
  creatorTips,
} from '@/lib/creatorData';
import { todayInNewYork } from '@/lib/onCallSheet';

// Creator mode's made-up data while it's on screen (docs/CREATOR-MODE.md): one
// copy per tab, made on first use from lib/creatorData.js and kept across
// client navigations, so a tip posted on /home shows on the profile and a
// lookup shows in History. lib/creatorFetch.js changes it; the creator
// wrappers (components/creator/) read it. A reload starts over.
//
// Updates are immutable (a new object for whatever changed), so a component
// reading one part re-renders only when that part changes.

let state = null;
const listeners = new Set();

function initial() {
  const now = Date.now();
  const today = todayInNewYork();
  const covers = creatorCovers(today);
  return {
    tips: creatorTips(now),
    history: creatorHistory(now),
    viewCount: CREATOR_VIEW_COUNT,
    places: creatorPlaces(now),
    placeComments: creatorPlaceComments(now),
    coverJobs: creatorCoverJobs(today),
    // Saved lists by week: [{ jobKey, jobNumber }], as cover-preferences keeps them.
    coverLists: Object.fromEntries(
      Object.entries(covers.lists).map(([week, entries]) => [
        week,
        entries.map(({ jobKey, jobNumber }) => ({ jobKey, jobNumber })),
      ]),
    ),
    // Edit profile's changes: { firstName, lastName, phone }, or null.
    profile: null,
    nextId: 1,
  };
}

export function creatorState() {
  if (!state) state = initial();
  return state;
}

// `recipe(state)` returns the fields that change.
export function updateCreator(recipe) {
  const current = creatorState();
  state = { ...current, ...recipe(current) };
  for (const listener of listeners) listener();
}

// A made-up id in the ObjectId shape, unique in this tab.
export function creatorId(prefix) {
  const { nextId } = creatorState();
  updateCreator(() => ({ nextId: nextId + 1 }));
  return `${prefix}${String(nextId).padStart(24 - prefix.length, '0')}`;
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// The whole state, or null on the server (the wrappers render in the browser,
// behind HydrationGuard, so they fall back to the page's props there).
export function useCreatorState() {
  return useSyncExternalStore(subscribe, creatorState, () => null);
}
