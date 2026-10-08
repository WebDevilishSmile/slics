'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  emptyRowState,
  isUnsaved,
  rowValues,
  toRowState,
} from './coverBidJobRow';

async function readJson(res, fallbackMessage) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || fallbackMessage);
  }
  return data;
}

/**
 * Owns the editable rows for one week: loading them, and creating, updating and
 * deleting them against the cover bid jobs API.
 *
 * Keyed on the formatted week string rather than the dayjs object so a caller
 * that builds a fresh dayjs each render doesn't send this into a refetch loop.
 */
export default function useCoverBidJobs({ weekEndDate, refreshKey }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savingKey, setSavingKey] = useState(null);
  const [deletingKey, setDeletingKey] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);

  const weekEnding = weekEndDate ? weekEndDate.format('YYYY-MM-DD') : null;

  useEffect(() => {
    if (!weekEnding) return;

    let cancelled = false;

    async function fetchJobs() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/coverBidJobs?weekEnding=${weekEnding}`);
        const data = await readJson(res, 'Failed to load cover bid jobs');
        if (!cancelled) setRows(data.data.map(toRowState));
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
          const res = await fetch('/api/coverBidJobs', {
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
          const res = await fetch(`/api/coverBidJob/${row._id}`, {
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
      const res = await fetch(`/api/coverBidJob/${row._id}`, {
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
      const res = await fetch(`/api/coverBidJobs?weekEnding=${weekEnding}`, {
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

  return {
    rows,
    loading,
    error,
    savingKey,
    deletingKey,
    deletingAll,
    updateField,
    addRow,
    saveRow,
    deleteRow,
    deleteAll,
  };
}
