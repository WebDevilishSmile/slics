'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { styled } from '@mui/material/styles';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getUpcomingSaturday } from '@/utils/functions';

const isInSameWeek = (day, referenceDay) =>
  Boolean(referenceDay) && day.isSame(referenceDay, 'week');

const WeekPickersDay = styled(PickersDay, {
  shouldForwardProp: (prop) => prop !== 'isSelected' && prop !== 'isHovered',
})(({ theme, isSelected, isHovered, day }) => ({
  borderRadius: 0,
  ...(isSelected && {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover, &:focus': {
      backgroundColor: theme.palette.primary.dark,
    },
  }),
  ...(isHovered &&
    !isSelected && {
      backgroundColor: theme.palette.action.hover,
    }),
  ...(day.day() === 0 && {
    borderTopLeftRadius: '50%',
    borderBottomLeftRadius: '50%',
  }),
  ...(day.day() === 6 && {
    borderTopRightRadius: '50%',
    borderBottomRightRadius: '50%',
  }),
}));

function WeekDay(props) {
  const {
    day,
    selectedDay,
    hoveredDay,
    onPointerEnter,
    onPointerLeave,
    ...other
  } = props;

  return (
    <WeekPickersDay
      {...other}
      day={day}
      selected={false}
      isSelected={isInSameWeek(day, selectedDay)}
      isHovered={isInSameWeek(day, hoveredDay)}
      onPointerEnter={() => onPointerEnter(day)}
      onPointerLeave={() => onPointerLeave(null)}
    />
  );
}

export default function CoverCalendar({
  value: valueProp,
  setValue: setValueProp,
  setSelectedWeek,
  setWeekEndDate: setWeekEndDateProp,
}) {
  const [internalValue, setInternalValue] = useState(() => dayjs());
  const [hoveredDay, setHoveredDay] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [weekEndDate, setWeekEndDate] = useState(() =>
    getUpcomingSaturday(dayjs()),
  );

  const value = valueProp ?? internalValue;
  const setValue = setValueProp ?? setInternalValue;

  const handleChange = (newDay) => {
    setValue(newDay);
    const saturday = getUpcomingSaturday(newDay);
    setWeekEndDate(saturday);
    setWeekEndDateProp?.(saturday);
    setSelectedWeek?.({
      start: newDay.startOf('week'),
      end: saturday,
    });
  };

  return (
    <Accordion
      expanded={calendarOpen}
      onChange={() => setCalendarOpen(!calendarOpen)}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>Week ending {weekEndDate.format('MM/DD/YYYY')}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateCalendar
            value={value}
            onChange={handleChange}
            showDaysOutsideCurrentMonth
            slots={{ day: WeekDay }}
            slotProps={{
              day: () => ({
                selectedDay: value,
                hoveredDay,
                onPointerEnter: setHoveredDay,
                onPointerLeave: () => setHoveredDay(null),
              }),
            }}
          />
        </LocalizationProvider>
      </AccordionDetails>
    </Accordion>
  );
}
