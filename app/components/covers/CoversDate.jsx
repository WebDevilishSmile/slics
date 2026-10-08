'use client';

import { useState } from 'react';
import dayjs from 'dayjs';

import { Paper, Typography } from '@mui/material';
import Calendar from './Calendar';
import { getUpcomingSaturday } from '@/utils/functions';

function CoversDate({ user, driver }) {
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [value, setValue] = useState(dayjs());
  const [weekEndDate, setWeekEndDate] = useState(() =>
    getUpcomingSaturday(dayjs())
  );

  return (
    <Paper
      variant='panel'
      className='enter'
      sx={{ minHeight: 0, alignItems: 'stretch', gap: 2.5 }}
    >
      <Typography variant='h6' component='p'>
        {user.name}
      </Typography>
      <Typography>Current cover {driver.jobs}</Typography>
      <Typography color='text.secondary'>
        Week ending {weekEndDate.format('MM/DD/YYYY')}
      </Typography>

      <Calendar
        selectedWeek={selectedWeek}
        setSelectedWeek={setSelectedWeek}
        value={value}
        setValue={setValue}
        setWeekEndDate={setWeekEndDate}
      />
    </Paper>
  );
}

export default CoversDate;
