'use client';

import { CloseOutlined, InfoOutlined } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';

import theme from '@/theme';

import { softPressSx, softRaised } from './soft';

// An informational notice in the soft style: a raised card in the page's own
// surface with a blue icon, the message, optional actions and an optional
// dismiss button (CLAUDE.md "Visual style"). For info only. Errors and
// successes are MUI Alerts, themed soft too, with the severity's color on
// the icon, where it carries meaning.
export default function SoftNotice({ icon, children, actions, onClose, closeLabel = 'Dismiss', sx }) {
  return (
    <Box
      role='status'
      sx={[
        softRaised,
        {
          width: '100%',
          maxWidth: theme.layout.width.panel,
          borderRadius: 3,
          p: 2,
          pr: onClose ? 1 : 2,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box sx={{ color: 'primary.main', display: 'flex', pt: 0.25 }}>
        {icon ?? <InfoOutlined />}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant='body2'>{children}</Typography>
        {actions && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, ml: -1 }}>
            {actions}
          </Box>
        )}
      </Box>
      {onClose && (
        <IconButton
          onClick={onClose}
          aria-label={closeLabel}
          sx={[softPressSx, { width: '3rem', height: '3rem', mt: -1 }]}
        >
          <CloseOutlined fontSize='small' />
        </IconButton>
      )}
    </Box>
  );
}
