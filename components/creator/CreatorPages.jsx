'use client';

import { useMemo } from 'react';

import {
  creatorCoverListStatus,
  creatorHistoryPage,
  creatorMyTips,
  withCommentCounts,
} from '@/lib/creatorData';
import { useCreatorState } from '@/lib/creatorStore';

import CoverBoard from '@/components/covers/CoverBoard';
import HistoryView from '@/components/history/HistoryView';
import PlaceFinder from '@/components/places/PlaceFinder';
import ProfileComments from '@/components/profile/ProfileComments';
import ProfileData from '@/components/profile/ProfileData';

// The driver pages in creator mode (docs/CREATOR-MODE.md): the real
// components, fed from the tab's made-up data (lib/creatorStore.js) instead of
// the page's props, so what was posted, edited or listed on another page (or
// before a router.refresh(), which re-renders the same made-up props) shows
// here. Each falls back to the page's props until the store is read.

// The profile: Edit profile's changes, and Alex's tips as they stand.
export function CreatorProfile({ userData, comments, ...props }) {
  const state = useCreatorState();
  const shownUser = useMemo(() => {
    const edit = state?.profile;
    if (!edit) return userData;
    const name = [edit.firstName, edit.lastName].filter(Boolean).join(' ') || userData.name;
    return { ...userData, ...edit, name };
  }, [state?.profile, userData]);
  const mine = useMemo(() => (state ? creatorMyTips(state.tips) : comments), [state, comments]);

  return (
    <>
      <ProfileData {...props} userData={shownUser} commentCount={mine.length} />
      <ProfileComments comments={mine} />
    </>
  );
}

// History, including the lookups made since the tab opened.
export function CreatorHistory({ initialPage, initialParams }) {
  const state = useCreatorState();
  const page = useMemo(
    () => (state ? creatorHistoryPage(state.history, initialParams) : initialPage),
    // Only on arrival: HistoryView keeps its own page from then on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Boolean(state)],
  );
  return <HistoryView initialPage={page} initialParams={initialParams} />;
}

// Places, with what was added, edited or commented.
export function CreatorPlaces({ places, slics, user }) {
  const state = useCreatorState();
  const shown = useMemo(
    () => (state ? withCommentCounts(state.places, state.placeComments) : places),
    [state, places],
  );
  return <PlaceFinder places={shown} slics={slics} user={user} />;
}

// The cover board, with the lists kept since the tab opened.
export function CreatorCoverBoard({ initialLists, ...props }) {
  const state = useCreatorState();
  const lists = useMemo(() => {
    if (!state) return initialLists;
    return Object.fromEntries(
      Object.entries(state.coverLists).map(([week, entries]) => [
        week,
        creatorCoverListStatus(
          entries.map((entry) => entry.jobNumber),
          state.coverJobs,
          week,
        ),
      ]),
    );
    // Only on arrival: CoverBoard keeps its own lists from then on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(state)]);
  return <CoverBoard {...props} initialLists={lists} />;
}
