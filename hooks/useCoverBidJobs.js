'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  autoHideReason,
  emptyRowState,
  isUnsaved,
  jobKey,
  rowValues,
  toRowState,
} from '@/lib/coverBidJobRow';

async function readJson(res, fallbackMessage) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || fallbackMessage);
  }
  return data;
}

/**
 * Owns the editable rows for one week: loading them, and creating, updating and
 * deleting them against the cover bid jobs API. Also the week's hides
 * (docs/COVER-JOB-HIDING.md): which job numbers are hidden from drivers.
 *
 * Keyed on the formatted week string rather than the dayjs object so a caller
 * that builds a fresh dayjs each render doesn't send this into a refetch loop.
 */
export function useCoverBidJobs({ weekEndDate, refreshKey }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savingKey, setSavingKey] = useState(null);
  const [deletingKey, setDeletingKey] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);
  // jobKey → { jobNumber, hiddenAt, hiddenBy: { name } } for the week's hidden
  // jobs, and the row whose hide is being saved.
  const [hides, setHides] = useState(() => new Map());
  const [hidingKey, setHidingKey] = useState(null);

  const weekEnding = weekEndDate ? weekEndDate.format('YYYY-MM-DD') : null;

  useEffect(() => {
    if (!weekEnding) return;

    let cancelled = false;

    async function fetchJobs() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/cover-bid-jobs?weekEnding=${weekEnding}`);
        const data = await readJson(res, 'Failed to load cover bid jobs');
        if (!cancelled) {
          setRows(data.data.map(toRowState));
          setHides(new Map((data.hidden ?? []).map((hide) => [hide.jobKey, hide])));
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchJobs();

    return () => {
      cancelled = true;
    };
  }, [weekEnding, refreshKey]);

  const updateField = useCallback((key, field, value) => {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    );
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, emptyRowState()]);
  }, []);

  const saveRow = useCallback(
    async (row) => {
      setSavingKey(row.key);
      setError(null);

      const values = rowValues(row);

      try {
        if (isUnsaved(row)) {
          const res = await fetch('/api/cover-bid-jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ weekEnding, rows: [values] }),
          });
          const data = await readJson(res, 'Failed to add job');
          const saved = data.data[0];

          // Adopt the server's id so the next save is an update, not a duplicate.
          setRows((prev) =>
            prev.map((r) =>
              r.key === row.key
                ? { key: saved._id, _id: saved._id, ...values, saved: values }
                : r
            )
          );
        } else {
          const res = await fetch(`/api/cover-bid-jobs/${row._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          });
          await readJson(res, 'Failed to update job');

          setRows((prev) =>
            prev.map((r) => (r.key === row.key ? { ...r, saved: values } : r))
          );
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setSavingKey(null);
      }
    },
    [weekEnding]
  );

  const deleteRow = useCallback(async (row) => {
    // Never persisted — just drop it.
    if (isUnsaved(row)) {
      setRows((prev) => prev.filter((r) => r.key !== row.key));
      return;
    }

    setDeletingKey(row.key);
    setError(null);

    try {
      const res = await fetch(`/api/cover-bid-jobs/${row._id}`, {
        method: 'DELETE',
      });
      await readJson(res, 'Failed to delete job');
      setRows((prev) => prev.filter((r) => r.key !== row.key));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setDeletingKey(null);
    }
  }, []);

  const deleteAll = useCallback(async () => {
    if (!weekEnding) return;

    setDeletingAll(true);
    setError(null);

    try {
      const res = await fetch(`/api/cover-bid-jobs?weekEnding=${weekEnding}`, {
        method: 'DELETE',
      });
      await readJson(res, 'Failed to delete jobs');
      setRows([]);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setDeletingAll(false);
    }
  }, [weekEnding]);

  // Why a row is hidden from drivers: 'sheet' or 'sleeper' when it's
  // automatic (autoHideReason), 'admin' for an admin's hide, or null. A hide
  // follows the saved job number, the one drivers' /covers sees, so an unsaved
  // row (or unsaved edit to the number) doesn't count.
  const hideReason = useCallback(
    (row) => {
      if (!row.saved) return null;
      const auto = autoHideReason({ ...row.saved, sheetHidden: row.sheetHidden });
      if (auto) return auto;
      return hides.has(jobKey(row.saved.jobNumber)) ? 'admin' : null;
    },
    [hides]
  );

  const isRowHidden = useCallback((row) => Boolean(hideReason(row)), [hideReason]);

  const toggleHidden = useCallback(
    async (row) => {
      const jobNumber = row.saved?.jobNumber ?? '';
      const key = jobKey(jobNumber);
      // An automatic hide is the sheet's to change, not the admin's.
      if (!weekEnding || !key || hideReason(row) === 'sheet' || hideReason(row) === 'sleeper') return;
      const hidden = hides.has(key);

      setHidingKey(row.key);
      setError(null);

      try {
        const res = await fetch('/api/cover-bid-jobs/hidden', {
          method: hidden ? 'DELETE' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weekEnding, jobNumber }),
        });
        const data = await readJson(
          res,
          hidden ? 'Failed to show the job to drivers' : 'Failed to hide the job'
        );
        setHides((prev) => {
          const next = new Map(prev);
          if (hidden) next.delete(key);
          else next.set(key, data.data);
          return next;
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setHidingKey(null);
      }
    },
    [weekEnding, hides, hideReason]
  );

  return {
    rows,
    loading,
    error,
    savingKey,
    deletingKey,
    deletingAll,
    hidingKey,
    updateField,
    addRow,
    saveRow,
    deleteRow,
    deleteAll,
    isRowHidden,
    hideReason,
    toggleHidden,
  };
}
