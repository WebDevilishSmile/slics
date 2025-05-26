import { TableCell, TableHead, TableRow } from '@mui/material';

function TableHeader() {
  return (
    <TableHead>
      <TableRow>
        <TableCell>Date</TableCell>
        <TableCell>Slic</TableCell>
        <TableCell>Alpha</TableCell>
        <TableCell>Name</TableCell>
        <TableCell>Select</TableCell>
      </TableRow>
    </TableHead>
  );
}

export default TableHeader;
