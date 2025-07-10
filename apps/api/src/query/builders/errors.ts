import type { ParameterBuilder } from '../types'
import { escapeSqlString } from '../utils'

export const errorBuilders: Record<string, ParameterBuilder> = {
  recent_errors: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      message as error_message,
      stack as error_stack,
      path as page_url,
      anonymous_id,
      session_id,
      timestamp as time,
      browser_name,
      browser_version,
      os_name,
      device_type,
      country,
      region
    FROM analytics.errors
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND message != ''
    ORDER BY timestamp DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  error_types: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      message as name,
      COUNT(*) as total_occurrences,
      uniq(anonymous_id) as affected_users,
      uniq(session_id) as affected_sessions,
      MAX(timestamp) as last_occurrence,
      MIN(timestamp) as first_occurrence
    FROM analytics.errors
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND message != ''
    GROUP BY message
    ORDER BY total_occurrences DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  errors_by_page: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      path as name,
      COUNT(*) as total_errors,
      COUNT(DISTINCT message) as unique_error_types,
      uniq(anonymous_id) as affected_users,
      uniq(session_id) as affected_sessions
    FROM analytics.errors
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND message != '' AND path != ''
    GROUP BY path
    ORDER BY total_errors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  errors_by_browser: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      CONCAT(browser_name, ' ', browser_version) as name,
      COUNT(*) as total_errors,
      COUNT(DISTINCT message) as unique_error_types,
      uniq(anonymous_id) as affected_users,
      uniq(session_id) as affected_sessions
    FROM analytics.errors
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND message != '' AND browser_name != '' AND browser_version IS NOT NULL AND browser_version != ''
    GROUP BY browser_name, browser_version
    ORDER BY total_errors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  errors_by_os: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      os_name as name,
      COUNT(*) as total_errors,
      COUNT(DISTINCT message) as unique_error_types,
      uniq(anonymous_id) as affected_users,
      uniq(session_id) as affected_sessions
    FROM analytics.errors
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND message != '' AND os_name != ''
    GROUP BY os_name
    ORDER BY total_errors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  errors_by_country: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      country as name,
      COUNT(*) as total_errors,
      COUNT(DISTINCT message) as unique_error_types,
      uniq(anonymous_id) as affected_users,
      uniq(session_id) as affected_sessions
    FROM analytics.errors
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND message != '' AND country != ''
    GROUP BY country
    ORDER BY total_errors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  errors_by_device: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      device_type as name,
      COUNT(*) as total_errors,
      COUNT(DISTINCT message) as unique_error_types,
      uniq(anonymous_id) as affected_users,
      uniq(session_id) as affected_sessions
    FROM analytics.errors
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND message != '' AND device_type != ''
    GROUP BY device_type
    ORDER BY total_errors DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  error_trends: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      toDate(timestamp) as date,
      COUNT(*) as total_errors,
      COUNT(DISTINCT message) as unique_error_types,
      uniq(anonymous_id) as affected_users,
      uniq(session_id) as affected_sessions
    FROM analytics.errors
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND timestamp >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND timestamp <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND message != ''
    GROUP BY toDate(timestamp)
    ORDER BY date ASC
    LIMIT ${limit} OFFSET ${offset}
  `,
} 