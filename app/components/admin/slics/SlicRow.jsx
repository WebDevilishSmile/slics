import { serializeSlic } from '@/utils/functions';
import { TableCell, TableRow, Typography } from '@mui/material';
import dayjs from 'dayjs';
import SlicOptions from './SlicOptions';

function editorLabel(userStamp) {
  if (!userStamp) return null;
  return userStamp.name || userStamp.email || 'Unknown';
}

function SlicRow({ slic }) {
  const lastEditor = editorLabel(slic.updatedBy) || editorLabel(slic.createdBy);
  const lastEditDate = slic.updatedBy ? slic.updated_at : slic.created_at;

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
      <TableCell
        sx={{
          whiteSpace: 'nowrap',
          maxWidth: '6rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {lastEditor ? (
          <>
            <Typography variant='body2' noWrap>
              {lastEditor}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {lastEditDate ? dayjs(lastEditDate).format('MM/DD/YY') : ''}
            </Typography>
          </>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell>
        <SlicOptions slic={serializeSlic(slic)} />
      </TableCell>
    </TableRow>
  );
}

export default SlicRow;
