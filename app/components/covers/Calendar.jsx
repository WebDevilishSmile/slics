'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { styled } from '@mui/material/styles';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
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
  shouldForwardProp: (prop) =>
    prop !== 'isSelected' &&
    prop !== 'isHovered' &&
    prop !== 'isToday' &&
    prop !== 'isPosted',
})(({ theme, isSelected, isHovered, isToday, isPosted, day }) => ({
  borderRadius: 0,
  // The week bar squares off mid-week days, so the today ring and the posted dot
  // are drawn as overlays to keep their own shape.
  position: 'relative',
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
  ...(isToday && {
    // MUI outlines today itself, which the squared-off week bar turns into a
    // rectangle — drop it and draw the ring below instead. warning.main rather
    // than secondary.main because secondary is green in dark mode and would
    // collide with the posted dot.
    '&.MuiPickersDay-today': {
      border: 'none',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      border: `2px solid ${theme.palette.warning.main}`,
      pointerEvents: 'none',
    },
  }),
  ...(isPosted && {
    '&::before': {
      content: '""',
      position: 'absolute',
      bottom: 2,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 4,
      height: 4,
      borderRadius: '50%',
      backgroundColor: isSelected
        ? theme.palette.primary.contrastText
        : theme.palette.success.main,
      pointerEvents: 'none',
    },
  }),
}));

function WeekDay(props) {
  const {
    day,
    selectedDay,
    hoveredDay,
    postedWeeks,
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
      isToday={day.isSame(dayjs(), 'day')}
      isPosted={Boolean(
        postedWeeks?.has(getUpcomingSaturday(day).format('YYYY-MM-DD')),
      )}
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
  postedWeeks,
  minDate,
}) {
  const [internalValue, setInternalValue] = useState(() => dayjs());
  const [hoveredDay, setHoveredDay] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const value = valueProp ?? internalValue;
  const setValue = setValueProp ?? setInternalValue;

  // Derived rather than stored, so the summary follows a value changed from outside.
  const weekEndDate = getUpcomingSaturday(value);

  const handleChange = (newDay) => {
    setValue(newDay);
    const saturday = getUpcomingSaturday(newDay);
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
        <DateCalendar
          value={value}
          onChange={handleChange}
          minDate={minDate}
          showDaysOutsideCurrentMonth
          slots={{ day: WeekDay }}
          slotProps={{
            day: () => ({
              selectedDay: value,
              hoveredDay,
              postedWeeks,
              onPointerEnter: setHoveredDay,
              onPointerLeave: () => setHoveredDay(null),
            }),
          }}
        />
      </AccordionDetails>
    </Accordion>
  );
}
