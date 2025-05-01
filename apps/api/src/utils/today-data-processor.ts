/**
 * Utilities for merging today's real-time data with historical data
 */
import { formatAvgSessionDuration, getCurrentHourFormatted, isToday } from './analytics-helpers';


interface TodayData {
  pageviews: number;
  visitors: number;
  sessions: number;
  bounce_rate: number;
  avg_session_duration?: number;
  [key: string]: any;
}

/**
 * Merge today's data into the summary
 * NOTE: We don't need to add today's data to summary since it's already included
 * We only use this for display purposes
 */
export function mergeTodayDataIntoSummary(
  summaryData: any,
  todayData: TodayData | null
): any {
  if (!todayData) {
    return summaryData;
  }

  // Just return the original summary data - no need to add today's data
  // as it's already included in the summary query
  return {
    ...summaryData,
    // Keep a reference to today's data for UI display
    today: {
      pageviews: todayData.pageviews || 0,
      visitors: todayData.visitors || 0, 
      sessions: todayData.sessions || 0,
      bounce_rate: todayData.bounce_rate || 0,
      bounce_rate_pct: `${Math.round((todayData.bounce_rate || 0) * 10) / 10}%`
    }
  };
}

/**
 * Update events by date to include today's data
 * We need to either replace or add today's entry, but NOT add to existing entry
 */
export function updateEventsWithTodayData(
  eventsByDate: any[],
  todayData: TodayData | null,
  granularity: 'hourly' | 'daily' = 'daily'
): any[] {
  if (!todayData) {
    return eventsByDate;
  }

  const updatedEvents = [...eventsByDate];
  const today = new Date().toISOString().split('T')[0];
  const currentHour = getCurrentHourFormatted();

  // For hourly granularity, we need to update each hour separately
  if (granularity === 'hourly') {
    // Only update the current hour with real-time data
    const currentHourIndex = updatedEvents.findIndex(entry => 
      entry.date === currentHour
    );

    // Create hourly stats object
    const hourlyStats = {
      date: currentHour,
      pageviews: todayData.pageviews || 0,
      unique_visitors: todayData.visitors || 0,
      visitors: todayData.visitors || 0,
      sessions: todayData.sessions || 0,
      bounce_rate: todayData.bounce_rate || 0,
      bounce_rate_pct: `${Math.round((todayData.bounce_rate || 0) * 10) / 10}%`,
      avg_session_duration: todayData.avg_session_duration || 0,
      avg_session_duration_formatted: formatAvgSessionDuration(todayData.avg_session_duration || 0)
    };

    if (currentHourIndex >= 0) {
      // Replace the current hour's entry with our real-time data
      updatedEvents[currentHourIndex] = hourlyStats;
    } else {
      // Add current hour if it doesn't exist
      updatedEvents.push(hourlyStats);
    }
  } else {
    // For daily granularity, update/add just today's entry
    const todayIndex = updatedEvents.findIndex(day => day.date?.substring(0, 10) === today);

    // Create daily stats object
    const dailyStats = {
      date: today,
      pageviews: todayData.pageviews || 0,
      unique_visitors: todayData.visitors || 0,
      visitors: todayData.visitors || 0,
      sessions: todayData.sessions || 0,
      bounce_rate: todayData.bounce_rate || 0,
      bounce_rate_pct: `${Math.round((todayData.bounce_rate || 0) * 10) / 10}%`,
      avg_session_duration: todayData.avg_session_duration || 0,
      avg_session_duration_formatted: formatAvgSessionDuration(todayData.avg_session_duration || 0)
    };

    if (todayIndex >= 0) {
      // Replace existing entry with today's data
      updatedEvents[todayIndex] = dailyStats;
    } else {
      // Add today if it doesn't exist
      updatedEvents.push(dailyStats);
    }
  }

  return updatedEvents;
}

/**
 * Merge today's data into trend data results
 * We need to replace today's entry, not add to it
 */
export function mergeTodayIntoTrends(
  trendData: any[],
  todayData: TodayData | null,
  granularity: 'hourly' | 'daily'
): any[] {
  if (!todayData) {
    return trendData;
  }

  return trendData.map(entry => {
    const entryDateString = entry.date.toString();
    const currentHour = getCurrentHourFormatted();
    
    // Check if this entry corresponds to today
    if ((granularity === 'daily' && isToday(entryDateString)) ||
        (granularity === 'hourly' && entryDateString === currentHour)) {
      
      // Replace with today's data, not add to it
      return {
        ...entry,
        pageviews: todayData.pageviews || 0,
        unique_visitors: todayData.visitors || 0,
        visitors: todayData.visitors || 0,
        sessions: todayData.sessions || 0,
        bounce_rate: todayData.bounce_rate || 0,
        bounce_rate_pct: `${Math.round((todayData.bounce_rate || 0) * 10) / 10}%`,
        avg_session_duration: todayData.avg_session_duration || 0,
        avg_session_duration_formatted: formatAvgSessionDuration(todayData.avg_session_duration || 0)
      };
    }
    
    return entry;
  });
}