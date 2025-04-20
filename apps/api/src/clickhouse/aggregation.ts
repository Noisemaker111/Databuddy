/**
 * ClickHouse Data Aggregation
 * 
 * Provides functions for aggregating raw event data into pre-defined aggregation tables.
 * This helps improve query performance for analytics dashboards by pre-calculating 
 * commonly used metrics.
 */

import { clickHouse } from './client';
import { format, subDays } from 'date-fns';
import { createLogger } from '../lib/logger';

const logger = createLogger('clickhouse:aggregation');



/**
 * Aggregates daily statistics for a specific date range and saves to daily_stats table
 * 
 * @param clientId The website ID to aggregate data for
 * @param startDate The start date to aggregate from (YYYY-MM-DD)
 * @param endDate The end date to aggregate to (YYYY-MM-DD)
 * @param force Whether to force re-aggregation even if data exists
 */
export async function aggregateDailyStats(
  clientId: string,
  startDate: string,
  endDate: string,
  force = false
) {
  try {
    logger.info(`Aggregating daily stats for ${clientId} from ${startDate} to ${endDate}`);
    
    // Delete existing data if force flag is true
    if (force) {
      const deleteQuery = `
        DELETE FROM analytics.daily_stats
        WHERE client_id = '${clientId}'
          AND date >= parseDateTimeBestEffort('${startDate}')
          AND date <= parseDateTimeBestEffort('${endDate}')
      `;
      
      await clickHouse.command({ query: deleteQuery });
      logger.info(`Deleted existing daily stats for ${clientId} from ${startDate} to ${endDate}`);
    }
    
    // Aggregate daily metrics
    const aggregationQuery = `
      INSERT INTO analytics.daily_stats
      SELECT
        client_id,
        toDate(time) as date,
        COUNT(CASE WHEN event_name = 'screen_view' THEN 1 END) as pageviews,
        COUNT(DISTINCT anonymous_id) as visitors,
        COUNT(DISTINCT session_id) as sessions,
        COALESCE(
          (SELECT (countIf(page_count = 1) / count(*)) * 100
           FROM 
             (SELECT 
                session_id, 
                countIf(event_name = 'screen_view') as page_count
              FROM analytics.events
              WHERE 
                client_id = '${clientId}'
                AND toDate(time) >= parseDateTimeBestEffort('${startDate}')
                AND toDate(time) <= parseDateTimeBestEffort('${endDate}')
              GROUP BY session_id)
          ), 0
        ) as bounce_rate,
        COALESCE(
          (SELECT AVG(duration)
           FROM 
             (SELECT 
                session_id, 
                dateDiff('second', MIN(time), MAX(time)) as duration
              FROM analytics.events
              WHERE 
                client_id = '${clientId}'
                AND toDate(time) >= parseDateTimeBestEffort('${startDate}')
                AND toDate(time) <= parseDateTimeBestEffort('${endDate}')
              GROUP BY session_id
              HAVING duration > 0)
          ), 0
        ) as avg_session_duration,
        now() as created_at
      FROM analytics.events
      WHERE 
        client_id = '${clientId}'
        AND toDate(time) >= parseDateTimeBestEffort('${startDate}')
        AND toDate(time) <= parseDateTimeBestEffort('${endDate}')
      GROUP BY client_id, toDate(time)
    `;
    
    await clickHouse.command({ query: aggregationQuery });
    logger.info(`Successfully aggregated daily stats for ${clientId} from ${startDate} to ${endDate}`);
    
    return {
      success: true,
      message: 'Daily stats aggregated successfully',
      details: {
        client_id: clientId,
        start_date: startDate,
        end_date: endDate
      }
    };
  } catch (error) {
    logger.error('Error aggregating daily stats:', error);
    return {
      success: false,
      message: 'Failed to aggregate daily stats',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Aggregates page statistics for a specific date range and saves to page_stats table
 * 
 * @param clientId The website ID to aggregate data for
 * @param startDate The start date to aggregate from (YYYY-MM-DD)
 * @param endDate The end date to aggregate to (YYYY-MM-DD)
 * @param force Whether to force re-aggregation even if data exists
 */
export async function aggregatePageStats(
  clientId: string,
  startDate: string,
  endDate: string,
  force = false
) {
  try {
    logger.info(`Aggregating page stats for ${clientId} from ${startDate} to ${endDate}`);
    
    // Delete existing data if force flag is true
    if (force) {
      const deleteQuery = `
        DELETE FROM analytics.page_stats
        WHERE client_id = '${clientId}'
          AND date >= parseDateTimeBestEffort('${startDate}')
          AND date <= parseDateTimeBestEffort('${endDate}')
      `;
      
      await clickHouse.command({ query: deleteQuery });
      logger.info(`Deleted existing page stats for ${clientId} from ${startDate} to ${endDate}`);
    }
    
    // Aggregate page metrics
    const aggregationQuery = `
      INSERT INTO analytics.page_stats
      SELECT
        client_id,
        toDate(time) as date,
        path,
        COUNT(*) as pageviews,
        COUNT(DISTINCT anonymous_id) as visitors,
        AVG(CASE WHEN time_on_page > 0 AND time_on_page IS NOT NULL THEN time_on_page / 1000 ELSE NULL END) as avg_time_on_page,
        now() as created_at
      FROM analytics.events
      WHERE 
        client_id = '${clientId}'
        AND toDate(time) >= parseDateTimeBestEffort('${startDate}')
        AND toDate(time) <= parseDateTimeBestEffort('${endDate}')
        AND event_name = 'screen_view'
      GROUP BY client_id, toDate(time), path
    `;
    
    await clickHouse.command({ query: aggregationQuery });
    logger.info(`Successfully aggregated page stats for ${clientId} from ${startDate} to ${endDate}`);
    
    return {
      success: true,
      message: 'Page stats aggregated successfully',
      details: {
        client_id: clientId,
        start_date: startDate,
        end_date: endDate
      }
    };
  } catch (error) {
    logger.error('Error aggregating page stats:', error);
    return {
      success: false,
      message: 'Failed to aggregate page stats',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Aggregates referrer statistics for a specific date range and saves to referrer_stats table
 * 
 * @param clientId The website ID to aggregate data for
 * @param startDate The start date to aggregate from (YYYY-MM-DD)
 * @param endDate The end date to aggregate to (YYYY-MM-DD)
 * @param force Whether to force re-aggregation even if data exists
 */
export async function aggregateReferrerStats(
  clientId: string,
  startDate: string,
  endDate: string,
  force = false
) {
  try {
    logger.info(`Aggregating referrer stats for ${clientId} from ${startDate} to ${endDate}`);
    
    // Delete existing data if force flag is true
    if (force) {
      const deleteQuery = `
        DELETE FROM analytics.referrer_stats
        WHERE client_id = '${clientId}'
          AND date >= parseDateTimeBestEffort('${startDate}')
          AND date <= parseDateTimeBestEffort('${endDate}')
      `;
      
      await clickHouse.command({ query: deleteQuery });
      logger.info(`Deleted existing referrer stats for ${clientId} from ${startDate} to ${endDate}`);
    }
    
    // Aggregate referrer metrics
    const aggregationQuery = `
      INSERT INTO analytics.referrer_stats
      SELECT
        client_id,
        toDate(time) as date,
        referrer,
        COUNT(DISTINCT anonymous_id) as visitors,
        COUNT(*) as pageviews,
        now() as created_at
      FROM analytics.events
      WHERE 
        client_id = '${clientId}'
        AND toDate(time) >= parseDateTimeBestEffort('${startDate}')
        AND toDate(time) <= parseDateTimeBestEffort('${endDate}')
        AND event_name = 'screen_view'
        AND referrer IS NOT NULL
        AND referrer != ''
      GROUP BY client_id, toDate(time), referrer
    `;
    
    await clickHouse.command({ query: aggregationQuery });
    logger.info(`Successfully aggregated referrer stats for ${clientId} from ${startDate} to ${endDate}`);
    
    return {
      success: true,
      message: 'Referrer stats aggregated successfully',
      details: {
        client_id: clientId,
        start_date: startDate,
        end_date: endDate
      }
    };
  } catch (error) {
    logger.error('Error aggregating referrer stats:', error);
    return {
      success: false,
      message: 'Failed to aggregate referrer stats',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Main function to aggregate all statistics for a specific date range
 * 
 * @param clientId The website ID to aggregate data for
 * @param startDate The start date to aggregate from (YYYY-MM-DD)
 * @param endDate The end date to aggregate to (YYYY-MM-DD)
 * @param force Whether to force re-aggregation even if data exists
 */
export async function aggregateAllStats(
  clientId: string,
  startDate?: string,
  endDate?: string,
  force = false
) {
  try {
    // Set default date range if not provided
    const now = new Date();
    const currentDate = format(now, 'yyyy-MM-dd');
    const defaultStartDate = format(subDays(now, 30), 'yyyy-MM-dd');
    
    // Use provided dates or defaults
    const effectiveStartDate = startDate || defaultStartDate;
    const effectiveEndDate = endDate || currentDate;
    
    logger.info(`Starting full aggregation for ${clientId} from ${effectiveStartDate} to ${effectiveEndDate}`);
    
    // Run all aggregation jobs in parallel
    const [dailyStats, pageStats, referrerStats] = await Promise.all([
      aggregateDailyStats(clientId, effectiveStartDate, effectiveEndDate, force),
      aggregatePageStats(clientId, effectiveStartDate, effectiveEndDate, force),
      aggregateReferrerStats(clientId, effectiveStartDate, effectiveEndDate, force)
    ]);
    
    const success = dailyStats.success && pageStats.success && referrerStats.success;
    
    logger.info(`Completed full aggregation for ${clientId} - Success: ${success}`);
    
    return {
      success,
      message: success ? 'All stats aggregated successfully' : 'Some aggregations failed',
      details: {
        client_id: clientId,
        start_date: effectiveStartDate,
        end_date: effectiveEndDate,
        daily_stats: dailyStats,
        page_stats: pageStats,
        referrer_stats: referrerStats
      }
    };
  } catch (error) {
    logger.error('Error in full aggregation:', error);
    return {
      success: false,
      message: 'Failed to run full aggregation',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Run aggregation for missing dates by checking what's in the aggregation tables
 * versus what dates we have data for in the events table
 * 
 * @param clientId The website ID to check and aggregate for
 * @param lookbackDays Number of days to look back for missing aggregations
 */
export async function aggregateMissingDates(
  clientId: string, 
  lookbackDays = 30
) {
  try {
    const now = new Date();
    const startDate = format(subDays(now, lookbackDays), 'yyyy-MM-dd');
    const endDate = format(now, 'yyyy-MM-dd');
    
    logger.info(`Checking for missing aggregations for ${clientId} from ${startDate} to ${endDate}`);
    
    // Query to get dates with data in events table
    const eventDatesQuery = `
      SELECT DISTINCT toDate(time) as date
      FROM analytics.events
      WHERE 
        client_id = '${clientId}'
        AND toDate(time) >= parseDateTimeBestEffort('${startDate}')
        AND toDate(time) <= parseDateTimeBestEffort('${endDate}')
      ORDER BY date
    `;
    
    // Query to get dates with data in daily_stats table
    const statsDatesQuery = `
      SELECT DISTINCT date
      FROM analytics.daily_stats
      WHERE 
        client_id = '${clientId}'
        AND date >= parseDateTimeBestEffort('${startDate}')
        AND date <= parseDateTimeBestEffort('${endDate}')
      ORDER BY date
    `;
    
    // Run both queries
    const [eventDatesResult, statsDatesResult] = await Promise.all([
      clickHouse.query({ query: eventDatesQuery }),
      clickHouse.query({ query: statsDatesQuery })
    ]);
    
    // Extract dates as strings
    const eventDates: string[] = (await eventDatesResult.json()).data.map((row: {date: string}) => row.date);
    const statsDates: string[] = (await statsDatesResult.json()).data.map((row: {date: string}) => row.date);
    
    // Find missing dates (dates in eventDates but not in statsDates)
    const missingDates = eventDates.filter(date => !statsDates.includes(date));
    
    logger.info(`Found ${missingDates.length} missing aggregation dates for ${clientId}`);
    
    if (missingDates.length === 0) {
      return {
        success: true,
        message: 'No missing aggregations found',
        details: {
          client_id: clientId,
          lookback_days: lookbackDays
        }
      };
    }
    
    // Group consecutive dates for more efficient aggregation
    const dateRanges: { start: string; end: string }[] = [];
    let currentRange: { start: string; end: string } | null = null;
    
    missingDates.forEach((date, index) => {
      // Convert to Date for comparison
      const currentDate = new Date(date);
      
      if (!currentRange) {
        currentRange = { start: date, end: date };
      } else {
        const previousDate = new Date(missingDates[index - 1]);
        const diffDays = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1) {
          // Consecutive date, extend current range
          currentRange.end = date;
        } else {
          // Gap in dates, push current range and start a new one
          dateRanges.push(currentRange);
          currentRange = { start: date, end: date };
        }
      }
    });
    
    // Push the last range if exists
    if (currentRange) {
      dateRanges.push(currentRange);
    }
    
    // Run aggregation for each date range
    const results = [];
    
    for (const range of dateRanges) {
      logger.info(`Aggregating missing data for ${clientId} from ${range.start} to ${range.end}`);
      
      const result = await aggregateAllStats(clientId, range.start, range.end);
      results.push({
        range,
        result
      });
    }
    
    return {
      success: true,
      message: `Aggregated ${missingDates.length} missing dates in ${dateRanges.length} ranges`,
      details: {
        client_id: clientId,
        missing_dates: missingDates,
        date_ranges: dateRanges,
        results
      }
    };
  } catch (error) {
    logger.error('Error aggregating missing dates:', error);
    return {
      success: false,
      message: 'Failed to aggregate missing dates',
      error: error instanceof Error ? error.message : String(error)
    };
  }
} 