import { EditOutlined } from '@mui/icons-material';
import { Box, Button } from '@mui/material';

import { userHasArea } from '@/lib/staffAreas';

import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

// "Edit SLIC" under the lookup card, for staff with the SLICs area: a quick
// way from a lookup to its edit page (/admin/edit/<numSlic>), which does its
// own area check. Drivers never see it.
export default function EditSlicLink({ slic, user }) {
  if (!userHasArea(user, 'slics')) return null;

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 2.5 }}>
      <Button
        href={`/admin/edit/${encodeURIComponent(slic.numSlic)}`}
        startIcon={<EditOutlined />}
        sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
      >
        Edit SLIC
      </Button>
    </Box>
  );
}
