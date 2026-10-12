'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';

import { COVER_LIST_MAX } from '@/constants';
import { isPicked, jobKey } from '@/lib/coverBidJobRow';
import { getUpcomingSaturday } from '@/lib/format';
import { tapHaptic } from '@/lib/haptics';
import CoverBidJobsTable from '@/components/coverBidJobs/CoverBidJobsTable';
import CoverList from '@/components/covers/CoverList';

const NO_ENTRIES = [];

// The week's jobs on /covers and, for a verified driver, their list for the
// week picked on the calendar (docs/COVER-BIDDING.md, stage 2). The calendar
// lives in CoverBidJobsTable; this holds the chosen day so the list follows
// it, and does the list's saving: every change PUTs the whole list
// (/api/users/me/cover-preferences) and shows it at once, going back if the
// save fails. Coming back to the page re-reads the shown week's list, so jobs
// picked meanwhile drop off.
// - `jobs`: driver rows (toDriverCoverJob), hidden jobs already left out.
// - `initialLists`: { weekEnding: entries with status } (lib/coverList.js).
// - `callIns`: { weekEnding: the driver's call-in time }.
// - `canList`: a verified driver; an admin who isn't sees the jobs only.
// - `offListWeeks`: posted weeks the driver isn't on (lib/coverDrivers.js
//   offListWeeks). They're read only: a list saved before shows, but can't
//   change, and none can be started.
// - `thisWeek`: the current week's Saturday; earlier lists can't change.
export default function CoverBoard({
  jobs,
  minWeekEnding,
  initialLists,
  callIns,
  dispatchPhone,
  canList,
  offListWeeks,
  thisWeek,
}) {
  // Next week: the week drivers bid on (as CoverBidJobsTable's own default).
  const [selectedDay, setSelectedDay] = useState(() => dayjs().add(1, 'week'));
  const selectedWeek = getUpcomingSaturday(selectedDay).format('YYYY-MM-DD');

  const [lists, setLists] = useState(initialLists ?? {});
  // The latest lists for handlers that run between renders (a quick second
  // tap): kept in step by the effect below and by save itself.
  const listsRef = useRef(lists);
  useEffect(() => {
    listsRef.current = lists;
  }, [lists]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const saveSeq = useRef(0);

  const weekJobs = useMemo(
    () => jobs.filter((job) => job.weekEnding === selectedWeek),
    [jobs, selectedWeek],
  );
  const jobsByKey = useMemo(() => {
    const byKey = new Map();
    for (const job of weekJobs) {
      const key = jobKey(job.jobNumber);
      if (key && !byKey.has(key)) byKey.set(key, job);
    }
    return byKey;
  }, [weekJobs]);

  const entries = useMemo(() => lists[selectedWeek] ?? NO_ENTRIES, [lists, selectedWeek]);
  const offList = Boolean(offListWeeks?.includes(selectedWeek));
  const editable = canList && !offList && selectedWeek >= thisWeek && weekJobs.length > 0;

  const save = useCallback(async (week, next, message) => {
    const previous = listsRef.current[week] ?? [];
    listsRef.current = { ...listsRef.current, [week]: next };
    setLists((current) => ({ ...current, [week]: next }));
    setError(null);
    setSaving(true);
    setAnnouncement(message);
    const seq = ++saveSeq.current;
    try {
      const res = await fetch('/api/users/me/cover-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekEnding: week, jobNumbers: next.map((entry) => entry.jobNumber) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save your list.");
      if (seq === saveSeq.current) {
        setLists((current) => ({ ...current, [week]: data.data.entries }));
      }
    } catch (err) {
      if (seq === saveSeq.current) {
        setLists((current) => ({ ...current, [week]: previous }));
        setError(err.message || "Couldn't save your list.");
        setAnnouncement('');
      }
    } finally {
      if (seq === saveSeq.current) setSaving(false);
    }
  }, []);

  // Move a job past the next open job above or below it; taken jobs keep
  // their places in the saved list.
  const move = (key, direction) => {
    const list = listsRef.current[selectedWeek] ?? [];
    const from = list.findIndex((entry) => entry.jobKey === key);
    if (from < 0) return;
    let to = from + direction;
    while (to >= 0 && to < list.length && list[to].status !== 'open') to += direction;
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    [next[from], next[to]] = [next[to], next[from]];
    const place = next.filter((entry) => entry.status === 'open').findIndex((entry) => entry.jobKey === key) + 1;
    tapHaptic();
    save(selectedWeek, next, `${list[from].jobNumber} is now choice ${place}.`);
  };

  const remove = (key) => {
    const list = listsRef.current[selectedWeek] ?? [];
    const entry = list.find((item) => item.jobKey === key);
    if (!entry) return;
    save(selectedWeek, list.filter((item) => item.jobKey !== key), `${entry.jobNumber} removed from your list.`);
  };

  const isFull = entries.length >= COVER_LIST_MAX;

  // What the job table needs to show an add/remove button on each job.
  const listControls = useMemo(() => {
    if (!editable) return null;
    const keys = new Set(entries.map((entry) => entry.jobKey));
    return {
      has: (job) => keys.has(jobKey(job.jobNumber)),
      canAdd: (job) => Boolean(jobKey(job.jobNumber)) && !isPicked(job) && !isFull,
      full: isFull,
      toggle: (job) => {
        const key = jobKey(job.jobNumber);
        if (!key) return;
        const list = listsRef.current[selectedWeek] ?? [];
        if (list.some((entry) => entry.jobKey === key)) {
          save(selectedWeek, list.filter((entry) => entry.jobKey !== key), `${job.jobNumber} removed from your list.`);
        } else {
          if (isPicked(job) || list.length >= COVER_LIST_MAX) return;
          const place = list.filter((entry) => entry.status === 'open').length + 1;
          tapHaptic();
          save(
            selectedWeek,
            [...list, { jobKey: key, jobNumber: job.jobNumber.trim(), status: 'open' }],
            `${job.jobNumber} added to your list as choice ${place}.`,
          );
        }
      },
    };
  }, [editable, entries, isFull, save, selectedWeek]);

  // Re-read the shown week's list when the driver comes back to the page:
  // jobs picked meanwhile (the sheet syncs within minutes) drop off.
  useEffect(() => {
    if (!canList) return undefined;
    const refresh = async () => {
      if (document.visibilityState !== 'visible') return;
      const seq = saveSeq.current;
      try {
        const res = await fetch(`/api/users/me/cover-preferences?week=${selectedWeek}`);
        const data = await res.json();
        if (res.ok && seq === saveSeq.current) {
          setLists((current) => ({ ...current, [selectedWeek]: data.data.entries }));
        }
      } catch {
        // The list on screen stays; the next visit tries again.
      }
    };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, [canList, selectedWeek]);

  const showList = canList && (entries.length > 0 || (weekJobs.length > 0 && !offList));

  return (
    <CoverBidJobsTable
      jobs={jobs}
      minWeekEnding={minWeekEnding}
      selectedDay={selectedDay}
      onSelectDay={setSelectedDay}
      list={listControls}
      beforeJobs={
        showList && (
          <CoverList
            weekEnding={selectedWeek}
            entries={entries}
            jobsByKey={jobsByKey}
            editable={editable}
            offList={offList}
            saving={saving}
            error={error}
            announcement={announcement}
            callIn={callIns?.[selectedWeek] ?? null}
            dispatchPhone={dispatchPhone}
            onMove={move}
            onRemove={remove}
          />
        )
      }
    />
  );
}
