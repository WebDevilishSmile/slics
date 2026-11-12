'use client';

import Link from '@/components/utility/NextLink';
import { ChevronRightOutlined, DirectionsOutlined } from '@mui/icons-material';
import { Button } from '@mui/material';

import SoftNotice from '@/components/utility/SoftNotice';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

const SLICS_SHOWN = 4;

// The /admin banner for drivers' open route suggestions (docs/SLIC-
// DIRECTIONS.md, stage 2): "2 route suggestions from drivers (HARCT, WORMA)"
// and a way to the queue. From getOpenRouteSuggestionSummary. Nothing when
// none are open.
export default function RouteSuggestionsNotice({ count, slics }) {
  if (!count) return null;

  const named = slics.slice(0, SLICS_SHOWN).join(', ') + (slics.length > SLICS_SHOWN ? ', …' : '');

  return (
    <SoftNotice
      icon={<DirectionsOutlined />}
      actions={
        <Button
          component={Link}
          href='/admin/routes'
          endIcon={<ChevronRightOutlined />}
          sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '2.75rem', ml: 1 }]}
        >
          View suggestions
        </Button>
      }
    >
      <strong>
        {count} route suggestion{count === 1 ? '' : 's'}
      </strong>{' '}
      from drivers ({named})
    </SoftNotice>
  );
}
