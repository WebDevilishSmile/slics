'use client';

import { useState } from 'react';
import dayjs from 'dayjs';

import { Typography } from '@mui/material';
import Calendar from './Calendar';
import { getUpcomingSaturday } from '@/utils/functions';

function CoversDate({ user, driver }) {
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [value, setValue] = useState(dayjs());
  const [weekEndDate, setWeekEndDate] = useState(() =>
    getUpcomingSaturday(dayjs())
  );

  return (
    <>
      <Typography>{user.name}</Typography>
      <Typography>Current cover {driver.jobs}</Typography>
      <Typography>
        Week ending {weekEndDate.format('MM/DD/YYYY')}
      </Typography>

      <Calendar
        selectedWeek={selectedWeek}
        setSelectedWeek={setSelectedWeek}
        value={value}
        setValue={setValue}
        setWeekEndDate={setWeekEndDate}
      />
    </>
  );
}

export default CoversDate;
