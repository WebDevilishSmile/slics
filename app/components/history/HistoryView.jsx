'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
  Typography,
} from '@mui/material';
import Link from 'next/link';

import theme from '@/utils/theme';
import { apiRequest } from '@/utils/apiRequest';

import HistoryFilters from './HistoryFilters';
import HistoryList from './HistoryList';
import HistoryNoteDialog from './HistoryNoteDialog';

const FILTER_KEYS = ['q', 'range', 'from', 'to', 'type', 'notes', 'sort'];
const NO_FILTERS = { q: null, range: null, from: null, to: null, type: null, notes: null };

const toQuery = (params, extra = {}) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...extra })) {
    if (value) search.set(key, value);
  }
  return search.toString();
};

// The member History page (TODOS.md "organize my history page"). The server
// renders the first page; filters live in the URL (so Back keeps them) and
// each change fetches from /api/user/history. Removing a row hides it on the
// server and offers Undo; the /home lookup counter still counts it.
export default function HistoryView({ initialPage, initialParams }) {
  const [params, setParams] = useState(initialParams);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [menu, setMenu] = useState(null); // { anchor, view }
  const [noteView, setNoteView] = useState(null);
  const [snack, setSnack] = useState(null); // { message, undo? }
  const [filtersKey, setFiltersKey] = useState(0);
  const lastQuery = useRef(toQuery(initialParams));
  const requestId = useRef(0);

  const changeParams = useCallback((changes) => {
    setParams((prev) => {
      const next = { ...prev, ...changes };
      for (const key of FILTER_KEYS) if (!next[key]) delete next[key];
      return next;
    });
  }, []);

  // Refetch from the top whenever the filters change. replaceState (not the
  // router) so the server page doesn't re-render a page we already fetch here.
  useEffect(() => {
    const query = toQuery(params);
    if (query === lastQuery.current) return;
    lastQuery.current = query;
    window.history.replaceState(null, '', query ? `/history?${query}` : '/history');

    const id = ++requestId.current;
    setLoading(true);
    setError('');
    apiRequest(`/api/user/history?${query}`, { method: 'GET' }).then(
      ({ data, error: message }) => {
        if (id !== requestId.current) return; // a newer filter won
        setLoading(false);
        if (message) setError(message);
        else setPage(data);
      },
    );
  }, [params]);

  const loadMore = async () => {
    setLoadingMore(true);
    const { data, error: message } = await apiRequest(
      `/api/user/history?${toQuery(params, { cursor: page.nextCursor })}`,
      { method: 'GET' },
    );
    setLoadingMore(false);
    if (message) {
      setSnack({ message });
      return;
    }
    setPage((prev) => {
      const seen = new Set(prev.views.map((view) => view.id));
      return {
        ...data,
        views: [...prev.views, ...data.views.filter((view) => !seen.has(view.id))],
      };
    });
  };

  const restore = (view, index) =>
    setPage((prev) => {
      if (prev.views.some((v) => v.id === view.id)) return prev;
      const views = [...prev.views];
      views.splice(Math.min(index, views.length), 0, view);
      return { ...prev, views, total: prev.total + 1 };
    });

  const setHidden = (view, hidden) =>
    apiRequest(`/api/user/history/${view.id}`, {
      method: 'PATCH',
      body: { hidden },
    });

  const remove = async (view) => {
    setMenu(null);
    const index = page.views.findIndex((v) => v.id === view.id);
    setPage((prev) => ({
      ...prev,
      views: prev.views.filter((v) => v.id !== view.id),
      total: prev.total - 1,
    }));

    const { error: message } = await setHidden(view, true);
    if (message) {
      restore(view, index);
      setSnack({ message });
      return;
    }
    setSnack({
      message: 'Removed from history',
      undo: async () => {
        setSnack(null);
        const { error: undoError } = await setHidden(view, false);
        if (undoError) setSnack({ message: undoError });
        else restore(view, index);
      },
    });
  };

  const noteSaved = (id, note) => {
    setNoteView(null);
    setPage((prev) => ({
      ...prev,
      views: prev.views.map((view) => (view.id === id ? { ...view, note } : view)),
    }));
    setSnack({ message: note ? 'Note saved' : 'Note deleted' });
  };

  const clearFilters = () => {
    changeParams(NO_FILTERS);
    setFiltersKey((key) => key + 1); // resets the search box too
  };

  const filtered = Boolean(params.q || params.range || params.type || params.notes);
  const count = `${page.total} ${filtered ? 'matching ' : ''}lookup${page.total === 1 ? '' : 's'}`;

  return (
    <Paper
      elevation={theme.layout.elevation}
      sx={{
        width: '100%',
        maxWidth: theme.layout.width.panel,
        mt: 3,
        px: { xs: 2, sm: 3 },
        py: 3,
        position: 'relative',
      }}
    >
      {loading && (
        <LinearProgress
          aria-label='Loading history'
          sx={{ position: 'absolute', top: 0, left: 0, right: 0 }}
        />
      )}

      <HistoryFilters key={filtersKey} params={params} onChange={changeParams} />

      <Typography
        variant='body2'
        role='status'
        sx={{ color: 'text.secondary', mt: 2, mb: 1 }}
      >
        {count}
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {page.views.length > 0 ? (
        <Box sx={{ opacity: loading ? 0.5 : 1, transition: 'opacity 150ms' }}>
          <HistoryList
            views={page.views}
            onOpenMenu={(anchor, view) => setMenu({ anchor, view })}
          />
        </Box>
      ) : filtered ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography sx={{ mb: 2 }}>Nothing matches these filters.</Typography>
          <Button variant='outlined' onClick={clearFilters}>
            Clear filters
          </Button>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography sx={{ mb: 2 }}>
            No lookups yet. Look up a SLIC and it shows up here.
          </Typography>
          <Button variant='contained' component={Link} href='/home'>
            Look up a SLIC
          </Button>
        </Box>
      )}

      {page.nextCursor && (
        <Button
          fullWidth
          variant='outlined'
          onClick={loadMore}
          disabled={loadingMore}
          startIcon={
            loadingMore ? <CircularProgress size={16} color='inherit' /> : null
          }
          sx={{ mt: 2, minHeight: '3rem' }}
        >
          Load more
        </Button>
      )}

      <Menu
        anchorEl={menu?.anchor}
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
      >
        <MenuItem
          sx={{ minHeight: '3rem' }}
          onClick={() => {
            setNoteView(menu.view);
            setMenu(null);
          }}
        >
          {menu?.view.note ? 'Edit note' : 'Add note'}
        </MenuItem>
        <MenuItem sx={{ minHeight: '3rem' }} onClick={() => remove(menu.view)}>
          Remove from history
        </MenuItem>
      </Menu>

      <HistoryNoteDialog
        view={noteView}
        onClose={() => setNoteView(null)}
        onSaved={noteSaved}
      />

      <Snackbar
        open={Boolean(snack)}
        onClose={(event, reason) => reason !== 'clickaway' && setSnack(null)}
        message={snack?.message}
        action={
          snack?.undo ? (
            <Button color='inherit' size='small' onClick={snack.undo}>
              Undo
            </Button>
          ) : null
        }
      />
    </Paper>
  );
}
