import { Typography } from '@mui/material';
import dayjs from 'dayjs';
import Calendar from './Calendar';

function CoversDate({ user }) {
  console.log(user);
  return (
    <>
      <Typography>{user.name}</Typography>
      <Typography>Current cover</Typography>
      <Typography>{dayjs().format('dddd, MMMM D')}</Typography>

      <Calendar />
    </>
  );
}

export default CoversDate;
