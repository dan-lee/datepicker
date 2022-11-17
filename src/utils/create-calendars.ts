import {
  DAYS_IN_WEEK,
  NOW,
  NUMBER_OF_STATIC_CALENDAR_DAYS,
} from '../constants';
import {
  CalendarConfig,
  CalendarMode,
  DatesConfig,
  LocaleConfig,
} from '../types';
import { addToDate, daysInMonth, formatDate, formatMonthName } from './date';
import { isAfter, isBefore, isBetween, isSame } from './predicates';

const willBeInRange = (
  day: Date,
  rangeEnd: Date,
  selectedDate: Date,
): boolean => {
  if (isSame(day, rangeEnd)) return true;
  if (isBefore(rangeEnd, selectedDate))
    return isBetween(rangeEnd, day, selectedDate);
  if (isAfter(rangeEnd, selectedDate))
    return isBetween(selectedDate, day, rangeEnd);

  return false;
};

const getNumberOfDays = (
  month: number,
  year: number,
  date: Date,
  calendarMode: CalendarMode,
  firstDayOffset: number,
): number => {
  if (calendarMode === 'static') return NUMBER_OF_STATIC_CALENDAR_DAYS;

  const days = daysInMonth(date);
  const lastDayOffset = new Date(year, month, days).getUTCDay();

  return firstDayOffset + days + DAYS_IN_WEEK - lastDayOffset - 1;
};

const getMonthParams = (
  month: number,
  year: number,
  calendarMode: CalendarMode,
) => {
  const firstDay = new Date(year, month, 1);
  // getUTCDay here because if month 1 day is sun it getDay returns 0 instead of 7
  const firstDayOffset = firstDay.getUTCDay();

  return {
    firstDayOffset,
    numberOfDaysToDisplay: getNumberOfDays(
      month,
      year,
      firstDay,
      calendarMode,
      firstDayOffset,
    ),
  };
};

const createCalendar = (
  calendarDate: Date,
  selectedDates: Date[],
  rangeEnd: Date | null,
  locale: LocaleConfig,
  { mode }: DatesConfig,
  calendarMode: CalendarMode,
) => {
  const { locale: localeStr, day, year: localeYear } = locale;
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const { firstDayOffset, numberOfDaysToDisplay } = getMonthParams(
    month,
    year,
    calendarMode,
  );
  const isRangeMode = mode === 'range';
  const days = [];

  for (let i = 1; i <= numberOfDaysToDisplay; i++) {
    const date = new Date(year, month, i - firstDayOffset);
    days.push({
      $date: date,
      date: formatDate(date, locale),
      day: date.toLocaleDateString(localeStr, { day }),
      currentDisplayedMonth: date.getMonth() === month,
      isToday: isSame(NOW, date),
      isSelected: selectedDates.some((d) => isSame(d as Date, date)),
      inRange:
        isRangeMode && selectedDates.length === 2
          ? isBetween(selectedDates[0], date, selectedDates[1])
          : false,
      isRangeStart:
        isRangeMode && selectedDates[0]
          ? isSame(date, selectedDates[0])
          : false,
      isRangeEnd:
        isRangeMode && selectedDates[1]
          ? isSame(date, selectedDates[1])
          : false,
      willBeInRange:
        isRangeMode && rangeEnd
          ? willBeInRange(date, rangeEnd, selectedDates[0])
          : false,
    });
  }

  return {
    year: calendarDate.toLocaleDateString(localeStr, { year: localeYear }),
    month: formatMonthName(calendarDate, locale),
    days,
  };
};

export const createCalendars = (
  calendarDate: Date,
  selectedDates: Date[],
  rangeEnd: Date | null,
  locale: LocaleConfig,
  dates: DatesConfig,
  { mode, offsets }: CalendarConfig,
) => {
  return offsets.map((offset) =>
    createCalendar(
      addToDate(calendarDate, offset, 'month'),
      selectedDates,
      rangeEnd,
      locale,
      dates,
      mode,
    ),
  );
};