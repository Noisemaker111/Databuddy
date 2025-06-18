/**
 * Timezone utilities for handling user timezone detection and date conversions
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export type TimezoneInfo = {
  timezone: string;
  offset: number;
};

/**
 * Validate timezone string
 */
export function isValidTimezone(tz: string): boolean {
  try {
    // dayjs.tz throws an error for invalid timezones
    dayjs().tz(tz);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Detect user timezone from various sources
 */
export function detectUserTimezone(
  headers: Headers,
  explicitTimezone?: string,
): TimezoneInfo {
  const timezonesToCheck = [
    explicitTimezone,
    headers.get('x-vercel-ip-timezone'),
    headers.get('cf-timezone'),
  ];

  for (const tz of timezonesToCheck) {
    if (tz && isValidTimezone(tz)) {
      return {
        timezone: tz,
        offset: dayjs().tz(tz).utcOffset(),
      };
    }
  }

  return {
    timezone: 'UTC',
    offset: 0,
  };
}

/**
 * Convert date string to a string in the user's timezone
 */
export function convertToUserTimezone(date: string, timezone: string): string {
  if (!isValidTimezone(timezone)) {
    return date;
  }
  return dayjs(date).tz(timezone).format('YYYY-MM-DD');
}

/**
 * Adjust a date range to fully encompass the range in a given timezone, returning the new range in UTC.
 */
export function adjustDateRangeForTimezone(
  startDate: string,
  endDate: string,
  timezone: string,
): { startDate: string; endDate: string } {
  if (!isValidTimezone(timezone) || timezone === 'UTC') {
    return { startDate, endDate };
  }

  const start = dayjs.tz(startDate, timezone).startOf('day').utc().format('YYYY-MM-DD');
  const end = dayjs.tz(endDate, timezone).endOf('day').utc().format('YYYY-MM-DD');

  return { startDate: start, endDate: end };
}

/**
 * Get the current date as a string in the given timezone.
 */
export function getCurrentDateInTimezone(timezone: string): string {
  if (!isValidTimezone(timezone)) {
    return dayjs().utc().format('YYYY-MM-DD');
  }
  return dayjs().tz(timezone).format('YYYY-MM-DD');
}

/**
 * Convert a UNIX timestamp to a Date object in the given timezone.
 */
export function convertTimestampToUserTimezone(
  timestamp: number,
  timezone: string,
): Date {
  if (!isValidTimezone(timezone)) {
    return new Date(timestamp);
  }
  return dayjs(timestamp).tz(timezone).toDate();
}
