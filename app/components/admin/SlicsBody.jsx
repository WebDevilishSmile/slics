'use client';

import { SLICS_PER_PAGE } from '@/utils/variables';
import { TableBody, TableCell, TableRow } from '@mui/material';
import SlicRow from '../newSlic/SlicRow';

function SlicsBody({ slics, page }) {
  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * SLICS_PER_PAGE - slics.length) : 0;

  return (
    <TableBody>
      {slics
        .slice(page * SLICS_PER_PAGE, page * SLICS_PER_PAGE + SLICS_PER_PAGE)
        .map((slic) => (
          <SlicRow key={slic._id} slic={slic} />
        ))}
      {emptyRows > 0 && (
        <TableRow sx={{ height: 73 * emptyRows }}>
          <TableCell colSpan={5} />
        </TableRow>
      )}
    </TableBody>
  );
}

export default SlicsBody;
