'use client';

import { useState } from 'react';
import Link from '@/components/utility/NextLink';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { DeleteOutline } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Link as MuiLink,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { apiRequest } from '@/lib/apiRequest';
import { softInset, softPressSx, softRaised, softRaisedSmall, softTableSx } from '@/components/utility/soft';
import DeleteSupportDialog from './DeleteSupportDialog';
import LinkSupportDialog from './LinkSupportDialog';

const TYPE_LABELS = {
  'membership.started': 'Became a member',
  'membership.updated': 'Membership updated',
  'membership.cancelled': 'Cancelled membership',
  'membership.canceled': 'Cancelled membership',
  'donation.created': 'Bought coffee',
  'recurring_donation.started': 'Started monthly support',
  'recurring_donation.updated': 'Monthly support updated',
  'recurring_donation.cancelled': 'Cancelled monthly support',
};
// A renewal and a failed charge both come as `.updated`; `update`
// (lib/db/bmcEvents.js) says which. Rows from before 2026-10-14 have none.
const UPDATE_LABELS = {
  renewed: { membership: 'Renewed membership', recurring_donation: 'Renewed monthly support' },
  paymentFailed: { membership: 'Membership payment failed', recurring_donation: 'Monthly support payment failed' },
  paid: { membership: 'Membership renewal paid', recurring_donation: 'Monthly support renewal paid' },
};
// Anything else is shown as BMC named it, so a new event type is visible
// before it gets a label here.
const typeLabel = (type, update) =>
  (type.endsWith('.updated') && UPDATE_LABELS[update]?.[type.split('.')[0]]) || TYPE_LABELS[type] || type;

function money(amount, currency) {
  if (amount === null || amount === undefined) return '';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
  } catch {
    return `${amount}${currency ? ` ${currency}` : ''}`;
  }
}

function Section({ id, title, count, children }) {
  return (
    <Box component='section' aria-labelledby={id} sx={{ width: '100%' }}>
      <Typography id={id} variant='h6' component='h3' sx={{ mb: 1.5 }}>
        {title}
        {count !== undefined && (
          <Box component='span' sx={{ color: 'text.secondary', fontWeight: 400 }}>
            {' '}
            ({count})
          </Box>
        )}
      </Typography>
      {children}
    </Box>
  );
}

function Empty({ children }) {
  return (
    <Typography variant='body2' color='text.secondary'>
      {children}
    </Typography>
  );
}

// The admin Supporters page (docs/BMC-SUPPORT.md stage 2). Shows what the BMC
// webhook has saved since 2026-10-10, and who's a member now. Recent loads ten
// at a time; an email with no account can be linked to one (`accounts`), and
// an event (BMC's test deliveries) can be deleted.
export default function SupportersView({ months, recent: firstPage, recentHasMore, unmatched, members, accounts }) {
  const router = useRouter();
  const [recent, setRecent] = useState(firstPage);
  const [hasMore, setHasMore] = useState(recentHasMore);
  // Deleting every row shown leaves Load more with no cursor, so the page the
  // refresh brings back takes their place.
  const [lastFirstPage, setLastFirstPage] = useState(firstPage);
  if (firstPage !== lastFirstPage) {
    setLastFirstPage(firstPage);
    if (recent.length === 0) {
      setRecent(firstPage);
      setHasMore(recentHasMore);
    }
  }
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [linking, setLinking] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const supporterOf = (event) =>
    event.userId
      ? event.userName || event.supporterName || 'Driver'
      : event.supporterName || event.email || 'Unknown supporter';

  // The totals and No matching account come from the server, so refresh them.
  const handleDeleted = (id) => {
    setDeleting(null);
    setRecent((current) => current.filter((event) => event._id !== id));
    router.refresh();
  };

  const loadMore = async () => {
    setLoadingMore(true);
    setLoadError('');
    const { data, error } = await apiRequest(
      `/api/bmc-events?before=${encodeURIComponent(recent.at(-1)._id)}`,
      { method: 'GET' },
    );
    setLoadingMore(false);
    if (error) return setLoadError(error);
    setRecent((current) => [...current, ...data.data.events]);
    setHasMore(data.data.hasMore);
  };

  return (
    <Stack spacing={4} sx={{ width: '100%' }}>
      <Section id='support-months' title='By month'>
        {months.length === 0 ? (
          <Empty>No support with an amount yet.</Empty>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size='small' sx={softTableSx} aria-labelledby='support-months'>
              <TableHead>
                <TableRow>
                  <TableCell>Month</TableCell>
                  <TableCell align='right'>Supports</TableCell>
                  <TableCell align='right'>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {months.map((row) => (
                  <TableRow key={`${row.month}-${row.currency}`}>
                    <TableCell>{dayjs(`${row.month}-01`).format('MMMM YYYY')}</TableCell>
                    <TableCell align='right'>{row.count}</TableCell>
                    <TableCell align='right'>{money(row.total, row.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Section>

      <Section id='support-recent' title='Recent'>
        {recent.length === 0 ? (
          <Empty>
            Nothing yet. Every Buy Me a Coffee event is saved here as it arrives (since October 10,
            2026).
          </Empty>
        ) : (
          <Stack component='ul' spacing={2} sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {recent.map((event) => (
              <Box
                component='li'
                key={event._id}
                sx={(theme) => ({ ...softRaised(theme), borderRadius: 4, p: 2 })}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700 }}>
                        {event.userId ? (
                          <MuiLink component={Link} href={`/admin/users/${event.userId}`}>
                            {supporterOf(event)}
                          </MuiLink>
                        ) : (
                          supporterOf(event)
                        )}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {event.test && (
                          <Box component='span' sx={{ fontWeight: 700, color: 'text.primary' }}>
                            Test ·{' '}
                          </Box>
                        )}
                        {typeLabel(event.type, event.update)} · {dayjs(event.receivedAt).format('MMM D, YYYY h:mm A')}
                        {!event.userId && ' · no account'}
                      </Typography>
                    </Box>
                    {event.amount !== null && (
                      <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {money(event.amount, event.currency)}
                      </Typography>
                    )}
                  </Box>
                  <IconButton
                    onClick={() => setDeleting(event)}
                    aria-label={`Delete ${typeLabel(event.type, event.update)} from ${supporterOf(event)}, ${dayjs(event.receivedAt).format('MMM D')}`}
                    sx={[softPressSx, { mt: -1, mr: -1, color: 'text.secondary' }]}
                  >
                    <DeleteOutline />
                  </IconButton>
                </Box>
                {event.message && (
                  <Typography
                    variant='body2'
                    sx={(theme) => ({
                      ...softInset(theme),
                      borderRadius: 3,
                      mt: 1.5,
                      p: 1.5,
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'anywhere',
                    })}
                  >
                    {event.message}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        )}
        {loadError && (
          <Alert severity='error' sx={{ mt: 2 }}>
            {loadError}
          </Alert>
        )}
        {hasMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
            <Button
              onClick={loadMore}
              disabled={loadingMore}
              startIcon={loadingMore ? <CircularProgress size={16} color='inherit' /> : null}
              sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </Button>
          </Box>
        )}
      </Section>

      <Section id='support-unmatched' title='No matching account' count={unmatched.length}>
        {unmatched.length === 0 ? (
          <Empty>Every supporter so far has an account with the same email.</Empty>
        ) : (
          <>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
              Their Buy Me a Coffee email isn&apos;t on any account, so a membership couldn&apos;t
              apply. If they signed up with a different email, link their support to that account:
              a membership that&apos;s still on turns on in the app too. Otherwise ask them to sign up
              with this email.
            </Typography>
            <Box
              component='ul'
              sx={(theme) => ({
                ...softInset(theme),
                listStyle: 'none',
                m: 0,
                p: 2,
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              })}
            >
              {unmatched.map((row) => (
                <Box
                  component='li'
                  key={row.email}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.5, typography: 'body2', overflowWrap: 'anywhere' }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ fontWeight: 600 }}>{row.name || row.email}</Box>
                    {row.name && <Box>{row.email}</Box>}
                    <Box sx={{ color: 'text.secondary' }}>
                      {row.count} event{row.count === 1 ? '' : 's'} ({row.types.map((type) => typeLabel(type)).join(', ')}) ·
                      last {dayjs(row.lastAt).format('MMM D, YYYY')}
                    </Box>
                  </Box>
                  <Button
                    size='small'
                    onClick={() => setLinking(row)}
                    sx={[softRaisedSmall, softPressSx, { px: 1.5, minHeight: '2.5rem', flexShrink: 0 }]}
                  >
                    Link to account
                  </Button>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Section>

      <Section id='support-members' title='Members now' count={members.length}>
        {members.length === 0 ? (
          <Empty>No members.</Empty>
        ) : (
          <Box
            component='ul'
            sx={(theme) => ({
              ...softInset(theme),
              listStyle: 'none',
              m: 0,
              p: 2,
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            })}
          >
            {members.map((member) => (
              <Box component='li' key={member._id} sx={{ typography: 'body2' }}>
                <MuiLink component={Link} href={`/admin/users/${member._id}`} sx={{ fontWeight: 600 }}>
                  {member.name || member.email}
                </MuiLink>
                {member.name && (
                  <Box component='span' sx={{ color: 'text.secondary' }}>
                    {' '}
                    · {member.email}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Section>
      {linking && (
        <LinkSupportDialog supporter={linking} accounts={accounts} onClose={() => setLinking(null)} />
      )}
      {deleting && (
        <DeleteSupportDialog
          event={deleting}
          label={[
            `${typeLabel(deleting.type, deleting.update)} from ${supporterOf(deleting)}`,
            money(deleting.amount, deleting.currency),
            dayjs(deleting.receivedAt).format('MMM D, YYYY h:mm A'),
          ]
            .filter(Boolean)
            .join(' · ')}
          onClose={() => setDeleting(null)}
          onDeleted={handleDeleted}
        />
      )}
    </Stack>
  );
}
