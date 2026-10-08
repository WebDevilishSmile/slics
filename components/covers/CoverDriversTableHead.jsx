import { TableCell, TableHead, TableRow } from '@mui/material';

function CoverDriversTableHead() {
  return (
    <TableHead>
      <TableRow>
        <TableCell sx={{ width: '3rem' }}></TableCell>
        <TableCell>Driver Name</TableCell>
        <TableCell sx={{ width: '8rem' }}>Options </TableCell>
      </TableRow>
    </TableHead>
  );
}

export default CoverDriversTableHead;
