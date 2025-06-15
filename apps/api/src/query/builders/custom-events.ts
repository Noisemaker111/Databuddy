import type { ParameterBuilder } from '../types'
import { escapeSqlString } from '../utils'

export const customEventBuilders: Record<string, ParameterBuilder> = {
  custom_events: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      event_name as name,
      COUNT(*) as total_events,
      uniq(anonymous_id) as unique_users,
      uniq(session_id) as unique_sessions,
      MAX(time) as last_occurrence,
      MIN(time) as first_occurrence,
      COUNT(DISTINCT path) as unique_pages,
      groupArray(JSONExtractKeys(properties)) as property_keys_arrays
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND event_name NOT IN ('screen_view', 'page_exit', 'error', 'web_vitals', 'link_out')
      AND event_name != ''
    GROUP BY event_name
    ORDER BY total_events DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  custom_event_details: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      event_name,
      time,
      path,
      anonymous_id,
      session_id,
      country,
      region,
      device_type,
      browser_name,
      os_name,
      JSONExtractKeys(CAST(properties AS String)) as property_keys,
      CAST(properties AS String) as properties_json
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND event_name NOT IN ('screen_view', 'page_exit', 'error', 'web_vitals', 'link_out')
      AND event_name != ''
    ORDER BY time DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  custom_events_by_page: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      path as name,
      COUNT(*) as total_events,
      COUNT(DISTINCT event_name) as unique_event_types,
      uniq(anonymous_id) as unique_users,
      uniq(session_id) as unique_sessions,
      groupArray(DISTINCT event_name) as event_types
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND event_name NOT IN ('screen_view', 'page_exit', 'error', 'web_vitals', 'link_out')
      AND event_name != ''
      AND path != ''
    GROUP BY path
    ORDER BY total_events DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  custom_events_by_user: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      anonymous_id as name,
      COUNT(*) as total_events,
      COUNT(DISTINCT event_name) as unique_event_types,
      COUNT(DISTINCT session_id) as unique_sessions,
      COUNT(DISTINCT path) as unique_pages,
      groupArray(DISTINCT event_name) as event_types,
      MAX(time) as last_event_time,
      MIN(time) as first_event_time
    FROM analytics.events
    WHERE client_id = ${escapeSqlString(websiteId)}
      AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND event_name NOT IN ('screen_view', 'page_exit', 'error', 'web_vitals', 'link_out')
      AND event_name != ''
    GROUP BY anonymous_id
    ORDER BY total_events DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  custom_event_properties: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    WITH property_analysis AS (
      SELECT 
        event_name,
        JSONExtractKeys(CAST(properties AS String)) as keys
      FROM analytics.events
      WHERE client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND event_name NOT IN ('screen_view', 'page_exit', 'error', 'web_vitals', 'link_out')
        AND event_name != ''
        AND properties IS NOT NULL
        AND properties != '{}'
    ),
    flattened_properties AS (
      SELECT 
        event_name,
        arrayJoin(keys) as property_key
      FROM property_analysis
      WHERE length(keys) > 0
    )
    SELECT 
      CONCAT(event_name, ':', property_key) as name,
      event_name,
      property_key,
      COUNT(*) as usage_count,
      COUNT(DISTINCT event_name) as event_types_count
    FROM flattened_properties
    WHERE property_key NOT IN ('__path', '__title', '__referrer', '__timestamp_ms', 'sessionId', 'sessionStartTime', 'screen_resolution', 'viewport_size', 'timezone', 'language', 'connection_type')
    GROUP BY event_name, property_key
    ORDER BY usage_count DESC
    LIMIT ${limit} OFFSET ${offset}
  `,

  custom_event_property_values: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily', timezone: string = 'UTC', filters: any[] = []) => {
    const eventNameFilter = filters.find((f: any) => f.field === 'event_name');
    const propertyKeyFilter = filters.find((f: any) => f.field === 'property_key');

    if (!eventNameFilter || !propertyKeyFilter || typeof eventNameFilter.value !== 'string' || typeof propertyKeyFilter.value !== 'string') {
      return `SELECT '' as name, 0 as total_events, 0 as unique_users WHERE 1=0`;
    }

    const eventName = eventNameFilter.value;
    const propertyKey = propertyKeyFilter.value;

    return `
      SELECT
        JSONExtractString(properties, ${escapeSqlString(propertyKey)}) as name,
        COUNT(*) as total_events,
        uniq(anonymous_id) as unique_users
      FROM analytics.events
      WHERE client_id = ${escapeSqlString(websiteId)}
        AND time >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND time <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
        AND event_name = ${escapeSqlString(eventName)}
        AND JSONHas(properties, ${escapeSqlString(propertyKey)})
        AND JSONExtractString(properties, ${escapeSqlString(propertyKey)}) != ''
      GROUP BY name
      ORDER BY total_events DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  },
} 