import { MoreVertOutlined } from '@mui/icons-material';
import { IconButton, TableCell, TableRow } from '@mui/material';
import dayjs from 'dayjs';
import SlicOptions from './SlicOptions';
import { serializeSlic } from '@/utils/functions';

function SlicRow({ slic }) {
  return (
    <TableRow key={slic._id}>
      <TableCell>{dayjs(slic.created_at).format('MM/DD/YY')}</TableCell>
      <TableCell>{slic.numSlic}</TableCell>
      <TableCell>{slic.alphaSlic}</TableCell>
      <TableCell>{slic.name}</TableCell>
      <TableCell>
        <SlicOptions slic={serializeSlic(slic)} />
      </TableCell>
    </TableRow>
  );
}

export default SlicRow;
