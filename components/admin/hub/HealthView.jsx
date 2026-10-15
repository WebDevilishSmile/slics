'use client';

import Link from '@/components/utility/NextLink';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { CheckCircleOutline, ErrorOutline, RefreshOutlined } from '@mui/icons-material';
import { Box, Button, CircularProgress, Link as MuiLink, Typography } from '@mui/material';

import { softInset, softPressSx, softRaised, softRaisedSmall } from '@/components/utility/soft';
import StatusLabel from './StatusLabel';
import { formatWhen } from './format';

// /admin/super/health (docs/SUPER-ADMIN-HUB.md stage E, lib/systemHealth.js):
// one card per check with its state as an icon and a word, and the details in
// a well. Keys show as set or not set, never their values. "Check again"
// reruns every check on the server.
function KeyList({ keys }) {
  return (
    <Box component='ul' sx={{ listStyle: 'none', m: 0, mt: 0.5, p: 0, display: 'flex', flexWrap: 'wrap', columnGap: 2, rowGap: 0.5 }}>
      {keys.map((key) => (
        <Box
          component='li'
          key={key.name}
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, typography: 'caption', fontFamily: 'monospace' }}
        >
          {key.set ? (
            <CheckCircleOutline sx={{ fontSize: '1rem', color: 'success.main' }} aria-hidden />
          ) : (
            <ErrorOutline sx={{ fontSize: '1rem', color: 'error.main' }} aria-hidden />
          )}
          {key.name}
          <Box component='span' sx={{ fontFamily: 'inherit', color: 'text.secondary' }}>
            {key.set ? 'set' : 'not set'}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function HealthCard({ section, index }) {
  return (
    <Box
      component='section'
      aria-labelledby={`health-${section.key}`}
      className='enter'
      sx={[softRaised, { '--i': index, borderRadius: 4, p: { xs: 2, sm: 2.5 }, display: 'flex', flexDirection: 'column', gap: 1.25, minWidth: 0 }]}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography id={`health-${section.key}`} component='h4' sx={{ fontWeight: 700 }}>
          {section.title}
        </Typography>
        <StatusLabel status={section.status} />
      </Box>
      <Typography variant='body2' color='text.secondary'>
        {section.summary}
        {section.href && (
          <>
            {' '}
            <MuiLink component={Link} href={section.href}>
              Open
            </MuiLink>
          </>
        )}
      </Typography>
      <Box
        component='ul'
        sx={[softInset, { listStyle: 'none', m: 0, p: 1.5, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1 }]}
      >
        {section.items.map((item, itemIndex) => (
          <Box component='li' key={`${item.label}-${itemIndex}`} sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant='body2' sx={{ fontWeight: 600 }}>
                {item.label}
              </Typography>
              {item.status !== 'info' && <StatusLabel status={item.status} />}
            </Box>
            <Typography variant='body2' color='text.secondary' sx={{ overflowWrap: 'anywhere' }}>
              {item.detail}
              {item.at && ` · ${formatWhen(item.at)}`}
            </Typography>
            {item.keys && <KeyList keys={item.keys} />}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function HealthView({ health }) {
  const router = useRouter();
  const [checking, startCheck] = useTransition();
  const problems = health.sections.filter((section) => section.status === 'error' || section.status === 'warning');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <StatusLabel
            status={health.status === 'info' ? 'ok' : health.status}
            word={problems.length === 0 ? 'Everything checks out' : `${problems.length} to look at`}
            size='medium'
          />
          <Typography variant='body2' color='text.secondary'>
            Checked {formatWhen(health.checkedAt)}
          </Typography>
        </Box>
        <Button
          onClick={() => startCheck(() => router.refresh())}
          disabled={checking}
          startIcon={checking ? <CircularProgress size={16} color='inherit' /> : <RefreshOutlined />}
          sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
        >
          Check again
        </Button>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
          gap: { xs: 2, sm: 2.5 },
          alignItems: 'start',
        }}
      >
        {health.sections.map((section, index) => (
          <HealthCard key={section.key} section={section} index={index} />
        ))}
      </Box>
    </Box>
  );
}
