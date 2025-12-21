import { TableCell, TableHead, TableRow } from '@mui/material';

function DriversTableHead() {
  return (
    <TableHead>
      <TableRow>
        <TableCell sx={{ width: '2rem' }}></TableCell>
        <TableCell>Name</TableCell>
        <TableCell sx={{ width: '7rem' }}>Seniority</TableCell>
        <TableCell sx={{ width: '2rem' }}></TableCell>
      </TableRow>
    </TableHead>
  );
}

export default DriversTableHead;
