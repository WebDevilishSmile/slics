'use client';

import { MoreHoriz } from '@mui/icons-material';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TablePagination,
  TableRow,
} from '@mui/material';
import dayjs from 'dayjs';
import { useState } from 'react';
import DriversTableHead from './DriversTableHead';
import TablePaginationActions from './TablePaginationActions';

function DriversTable({ allDrivers }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - allDrivers.length) : 0;

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  return (
    <TableContainer component={Paper}>
      <Table size='small'>
        <DriversTableHead />

        <TableBody>
          {allDrivers
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((driver, index) => (
              <TableRow key={driver.employeeId}>
                <TableCell sx={{ width: '2rem' }}>
                  {index + 1 + page * rowsPerPage}
                </TableCell>
                <TableCell>{driver.name}</TableCell>
                <TableCell sx={{ width: '9rem' }}>
                  {/* Displaying the cleaned string directly */}
                  {driver.seniorityDate.includes('-A')
                    ? driver.seniorityDate.replace('-A', '')
                    : driver.seniorityDate}
                </TableCell>
                <TableCell sx={{ width: '2rem' }}>
                  <MoreHoriz />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TablePagination
              rowsPerPageOptions={[]}
              count={allDrivers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              ActionsComponent={TablePaginationActions}
              labelRowsPerPage=''
              labelDisplayedRows={() => ''}
              sx={{
                '.MuiToolbar-root': {
                  justifyContent: 'center',
                  padding: 0, // Optional: removes extra side padding
                },
                '.MuiTablePagination-spacer': {
                  display: 'none', // Required: removes the "pusher" element that forces content to the right
                },
              }}
            />
          </TableRow>
          <TableRow>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              count={allDrivers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage='Rows per page:'
              sx={{
                '.MuiToolbar-root': {
                  justifyContent: 'center',
                  padding: 0, // Optional: removes extra side padding
                },
                '.MuiTablePagination-spacer': {
                  display: 'none', // Required: removes the "pusher" element that forces content to the right
                },
                '& .MuiTablePagination-actions': {
                  display: 'none',
                },
              }}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}

export default DriversTable;
