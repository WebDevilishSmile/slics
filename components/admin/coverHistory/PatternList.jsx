'use client';

import {
  ChevronRightOutlined,
  InfoOutlined,
  ReportProblemOutlined,
  TrendingDownOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import { Box, ButtonBase, Typography } from '@mui/material';

import { softInset, softPressSx } from '@/components/utility/soft';

// Each tone has its own icon as well as its color, so a finding never says
// what it is by color alone.
const TONES = {
  up: { Icon: TrendingUpOutlined, color: 'success.main', label: 'Trend up' },
  down: { Icon: TrendingDownOutlined, color: 'warning.main', label: 'Trend down' },
  alert: { Icon: ReportProblemOutlined, color: 'error.main', label: 'Worth a look' },
  note: { Icon: InfoOutlined, color: 'primary.main', label: 'Note' },
};

function Finding({ finding, index, onOpen }) {
  const { Icon, color, label } = TONES[finding.tone] ?? TONES.note;
  const body = (
    <>
      <Icon aria-label={label} sx={{ color, mt: 0.25, flexShrink: 0 }} />
      <Typography variant='body2' sx={{ flex: 1, minWidth: 0 }}>
        {finding.text}
      </Typography>
      {finding.anchor && <ChevronRightOutlined sx={{ color: 'primary.main', flexShrink: 0 }} />}
    </>
  );
  const sx = {
    '--i': index,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 1.5,
    width: '100%',
    textAlign: 'left',
    px: 1.5,
    py: 1.25,
    borderRadius: 3,
  };
  return (
    <Box component='li' className='enter' sx={{ '--i': index }}>
      {finding.anchor ? (
        <ButtonBase onClick={() => onOpen(finding.anchor)} sx={[softPressSx, sx, { minHeight: '3rem' }]}>
          {body}
        </ButtonBase>
      ) : (
        <Box sx={sx}>{body}</Box>
      )}
    </Box>
  );
}

// "What stands out" (findPatterns, lib/coverHistory.js): plain-language
// findings in one inset well, each opening what it's about (a week below, or
// the Jobs or Drivers table with its filter).
export default function PatternList({ patterns, onOpen }) {
  if (!patterns.length) {
    return (
      <Typography variant='body2' color='text.secondary'>
        Nothing stands out yet. Patterns show once a few weeks are saved.
      </Typography>
    );
  }
  return (
    <Box
      component='ul'
      sx={[softInset, { listStyle: 'none', m: 0, p: { xs: 1, sm: 1.5 }, borderRadius: 4, display: 'grid', gap: 0.5 }]}
    >
      {patterns.map((finding, index) => (
        <Finding key={finding.id} finding={finding} index={index} onOpen={onOpen} />
      ))}
    </Box>
  );
}
