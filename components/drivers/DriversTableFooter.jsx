import { TableFooter, TablePagination, TableRow } from '@mui/material';
import TablePaginationActions from './TablePaginationActions';

function DriversTableFooter({
  allDrivers,
  page,
  rowsPerPage,
  handleChangePage,
  handleChangeRowsPerPage,
}) {
  return (
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
  );
}

export default DriversTableFooter;
