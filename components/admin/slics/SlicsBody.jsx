'use client';

import { SLICS_PER_PAGE } from '@/constants';
import { TableBody } from '@mui/material';
import SlicRow from './SlicRow';

// One page of the table. A short last page just ends: padding it out to a
// full page left a long blank area once a page held 25 rows.
function SlicsBody({ slics, page }) {
  return (
    <TableBody>
      {slics
        .slice(page * SLICS_PER_PAGE, page * SLICS_PER_PAGE + SLICS_PER_PAGE)
        .map((slic) => (
          <SlicRow key={slic._id} slic={slic} />
        ))}
    </TableBody>
  );
}

export default SlicsBody;
