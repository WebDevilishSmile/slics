'use client';

import { TableBody, TableCell, TableRow } from '@mui/material';
import SlicRow from '../newSlic/SlicRow';
import { useState } from 'react';

function SlicsBody({ slics, page = 0 }) {
  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * 10 - slics.length) : 0;

  return (
    <TableBody>
      {slics.slice(page * 10, page * 10 + 10).map((slic) => (
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
