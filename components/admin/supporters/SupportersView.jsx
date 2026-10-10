'use client';

import Link from 'next/link';
import dayjs from 'dayjs';
import {
  Box,
  Link as MuiLink,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { softInset, softRaised, softTableSx } from '@/components/utility/soft';

const TYPE_LABELS = {
  'membership.started': 'Became a member',
  'membership.cancelled': 'Cancelled membership',
  'membership.canceled': 'Cancelled membership',
  'donation.created': 'Bought coffee',
  'recurring_donation.started': 'Started monthly support',
  'recurring_donation.cancelled': 'Cancelled monthly support',
};
// Anything else is shown as BMC named it, so a new event type is visible
// before it gets a label here.
const typeLabel = (type) => TYPE_LABELS[type] ?? type;

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
// webhook has saved since 2026-10-10, and who's a member now.
export default function SupportersView({ months, recent, unmatched, members }) {
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

      <Section id='support-recent' title='Recent' count={recent.length}>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700 }}>
                      {event.userId ? (
                        <MuiLink component={Link} href={`/admin/users/${event.userId}`}>
                          {event.userName || event.supporterName || 'Driver'}
                        </MuiLink>
                      ) : (
                        event.supporterName || event.email || 'Unknown supporter'
                      )}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {typeLabel(event.type)} · {dayjs(event.receivedAt).format('MMM D, YYYY h:mm A')}
                      {!event.userId && ' · no account'}
                    </Typography>
                  </Box>
                  {event.amount !== null && (
                    <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {money(event.amount, event.currency)}
                    </Typography>
                  )}
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
      </Section>

      <Section id='support-unmatched' title='No matching account' count={unmatched.length}>
        {unmatched.length === 0 ? (
          <Empty>Every supporter so far has an account with the same email.</Empty>
        ) : (
          <>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
              Their Buy Me a Coffee email isn&apos;t on any account, so a membership couldn&apos;t
              apply. Ask them to sign up with that email, or turn membership on by hand on their
              account in Users.
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
                <Box component='li' key={row.email} sx={{ typography: 'body2', overflowWrap: 'anywhere' }}>
                  <Box sx={{ fontWeight: 600 }}>{row.name || row.email}</Box>
                  {row.name && <Box>{row.email}</Box>}
                  <Box sx={{ color: 'text.secondary' }}>
                    {row.count} event{row.count === 1 ? '' : 's'} ({row.types.map(typeLabel).join(', ')}) ·
                    last {dayjs(row.lastAt).format('MMM D, YYYY')}
                  </Box>
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
    </Stack>
  );
}
