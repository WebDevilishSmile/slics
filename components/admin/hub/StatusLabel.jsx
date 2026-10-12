'use client';

import {
  CheckCircleOutline,
  ErrorOutline,
  InfoOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { Box } from '@mui/material';

// A health state as an icon and a word, never color alone (CLAUDE.md "Visual
// style"): the icon wears the status color, the word the text color.
const STATUSES = {
  ok: { icon: CheckCircleOutline, color: 'success.main', word: 'OK' },
  warning: { icon: WarningAmberOutlined, color: 'warning.main', word: 'Check' },
  error: { icon: ErrorOutline, color: 'error.main', word: 'Problem' },
  info: { icon: InfoOutlined, color: 'text.secondary', word: 'Info' },
};

export default function StatusLabel({ status = 'info', word, size = 'small' }) {
  const { icon: Icon, color, word: defaultWord } = STATUSES[status] ?? STATUSES.info;
  return (
    <Box
      component='span'
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, typography: 'body2', fontWeight: 600 }}
    >
      <Icon fontSize={size} sx={{ color }} aria-hidden />
      {word ?? defaultWord}
    </Box>
  );
}
