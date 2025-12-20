import { serializeSlic } from '@/utils/functions';
import { TableCell, TableRow } from '@mui/material';
import dayjs from 'dayjs';
import SlicOptions from './SlicOptions';

function SlicRow({ slic }) {
  return (
    <TableRow key={slic._id}>
      <TableCell
        sx={{
          whiteSpace: 'nowrap',
          maxWidth: '4rem',
        }}
      >
        {dayjs(slic.created_at).format('MM/DD/YY')}
      </TableCell>
      <TableCell
        sx={{
          whiteSpace: 'nowrap',
          maxWidth: '4rem',
        }}
      >
        {slic.numSlic}
      </TableCell>
      <TableCell
        sx={{
          whiteSpace: 'nowrap',
          maxWidth: '4rem',
        }}
      >
        {slic.alphaSlic}
      </TableCell>
      <TableCell
        sx={{
          whiteSpace: 'nowrap',
          maxWidth: '4rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {slic.name}
      </TableCell>
      <TableCell>
        <SlicOptions slic={serializeSlic(slic)} />
      </TableCell>
    </TableRow>
  );
}

export default SlicRow;
