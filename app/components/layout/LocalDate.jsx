'use client';

import dayjs from 'dayjs';

export default function LocalDate({ date, format = 'MMM D, h:mm A' }) {
  return <span>{dayjs(date).format(format)}</span>;
}
