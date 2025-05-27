'use client';

import { Table, TableFooter, TablePagination, TableRow } from '@mui/material';
import TableHeader from './TableHeader';
import SlicsBody from './SlicsBody';
import { useState } from 'react';

function SlicsTable({ slics }) {
  const [page, setPage] = useState(0);
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  return (
    <Table>
      <TableHeader />

      <SlicsBody slics={slics} page={page} />

      <TableFooter>
        <TableRow>
          <TablePagination
            rowsPerPage={10}
            rowsPerPageOptions={[]}
            onPageChange={handleChangePage}
            count={slics.length}
            page={page}
          />
        </TableRow>
      </TableFooter>
    </Table>
  );
}

export default SlicsTable;
