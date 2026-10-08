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
import { getUpcomingSaturday } from '@/lib/format';
import { softInset } from '@/components/utility/soft';

const isInSameWeek = (day, referenceDay) =>
  Boolean(referenceDay) && day.isSame(referenceDay, 'week');

const WeekPickersDay = styled(PickersDay, {
  shouldForwardProp: (prop) =>
    prop !== 'isSelected' &&
    prop !== 'isHovered' &&
    prop !== 'isToday' &&
    prop !== 'isPosted',
})(({ theme, isSelected, isHovered, isToday, isPosted, day }) => ({
  // theme.vars, not theme.palette: the palette object holds only the light
  // scheme's values, and primary differs per scheme (UI-SUGGESTIONS.md #31).
  borderRadius: 0,
  // The week bar squares off mid-week days, so the today ring and the posted dot
  // are drawn as overlays to keep their own shape.
  position: 'relative',
  ...(isSelected && {
    backgroundColor: theme.vars.palette.primary.main,
    color: theme.vars.palette.primary.contrastText,
    '&:hover, &:focus': {
      backgroundColor: theme.vars.palette.primary.dark,
    },
  }),
  ...(isHovered &&
    !isSelected && {
      backgroundColor: theme.vars.palette.action.hover,
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
    // rectangle — drop it and draw the ring below instead. warning.main so the
    // ring never shares a color with the success-green posted dot.
    '&.MuiPickersDay-today': {
      border: 'none',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      border: `2px solid ${theme.vars.palette.warning.main}`,
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
        ? theme.vars.palette.primary.contrastText
        : theme.vars.palette.success.main,
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
    // An inset well rather than a raised card: it sits inside the raised
    // filter bar on /cover-bid-jobs, and one emboss level is the rule.
    <Accordion
      expanded={calendarOpen}
      onChange={() => setCalendarOpen(!calendarOpen)}
      disableGutters
      elevation={0}
      square={false}
      sx={[
        softInset,
        {
          borderRadius: 3,
          '&::before': { display: 'none' },
          '&:first-of-type, &:last-of-type': { borderRadius: 3 },
        },
      ]}
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
