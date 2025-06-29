/**
 * Combined Analytics Builders
 *
 * Efficient builders that combine multiple related analytics queries
 * into single optimized queries for better performance.
 */

import { createSqlBuilder } from "./utils";

// Data types
export interface DeviceInfoData {
	device_type: string;
	device_brand: string;
	device_model: string;
	browser_name: string;
	browser_version: string;
	os_name: string;
	os_version: string;
	screen_resolution: string;
	connection_type: string;
	visitors: number;
	pageviews: number;
}

export interface GeoInfoData {
	country: string;
	language: string;
	timezone: string;
	visitors: number;
	pageviews: number;
}

export interface TodayData {
	hour?: number;
	pageviews: number;
	unique_visitors: number;
	sessions: number;
	bounce_rate: number;
	avg_session_duration: number;
}

export interface ContentData {
	type: "page" | "referrer";
	path?: string;
	referrer?: string;
	pageviews: number;
	visitors: number;
	avg_time_on_page?: number;
}

export interface EnhancedPageData {
	path: string;
	title: string;
	pageviews: number;
	visitors: number;
	avg_time_on_page: number | null;
	entries: number;
	exits: number;
	bounce_rate: number;
}

/**
 * Creates a combined builder for device information
 * Replaces: createDeviceTypesBuilder, createBrowserVersionsBuilder,
 * createScreenResolutionsBuilder, createConnectionTypesBuilder
 */
export function createDeviceInfoBuilder(
	websiteId: string,
	startDate: string,
	endDate: string,
	limit = 100,
) {
	const builder = createSqlBuilder();

	const sql = `
    SELECT
      COALESCE(device_type, 'desktop') as device_type,
      COALESCE(device_brand, 'Unknown') as device_brand,
      COALESCE(device_model, 'Unknown') as device_model,
      COALESCE(browser_name, 'Unknown') as browser_name,
      COALESCE(browser_version, 'Unknown') as browser_version,
      COALESCE(os_name, 'Unknown') as os_name,
      COALESCE(os_version, 'Unknown') as os_version,
      COALESCE(screen_resolution, 'Unknown') as screen_resolution,
      COALESCE(connection_type, 'Unknown') as connection_type,
      COUNT(DISTINCT anonymous_id) as visitors,
      COUNT(*) as pageviews
    FROM analytics.events
    WHERE 
      client_id = '${websiteId}'
      AND time >= parseDateTimeBestEffort('${startDate}')
      AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
      AND event_name = 'screen_view'
    GROUP BY 
      device_type,
      device_brand,
      device_model,
      browser_name,
      browser_version,
      os_name,
      os_version,
      screen_resolution,
      connection_type
    ORDER BY visitors DESC, pageviews DESC
    ${limit ? `LIMIT ${limit}` : ""}
  `;

	builder.getSql = () => sql;
	return builder;
}

/**
 * Creates a combined builder for today's data (both summary and hourly)
 * Replaces: createTodayBuilder, createTodayByHourBuilder
 */
export function createTodayDataBuilder(websiteId: string) {
	const builder = createSqlBuilder();

	const sql = `
    WITH session_metrics AS (
      SELECT
        session_id,
        countIf(event_name = 'screen_view') as page_count
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND toDate(time) = today()
      GROUP BY session_id
    ),
    session_durations AS (
      SELECT
        session_id,
        dateDiff('second', MIN(time), MAX(time)) as duration
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND toDate(time) = today()
      GROUP BY session_id
      HAVING duration > 0
    ),
    unique_visitors AS (
      SELECT
        countDistinct(anonymous_id) as unique_visitors
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND toDate(time) = today()
        AND event_name = 'screen_view'
    )
    SELECT
      null as hour,
      sum(page_count) as pageviews,
      (SELECT unique_visitors FROM unique_visitors) as unique_visitors,
      count(session_metrics.session_id) as sessions,
      (COALESCE(countIf(page_count = 1), 0) / COALESCE(COUNT(*), 1)) * 100 as bounce_rate,
      COALESCE(AVG(sd.duration), 0) as avg_session_duration
    FROM session_metrics
    LEFT JOIN session_durations as sd ON session_metrics.session_id = sd.session_id
  `;

	builder.getSql = () => sql;
	return builder;
}

/**
 * Creates a combined builder for content performance data
 * Replaces: createTopPagesBuilder, createTopReferrersBuilder
 */
export function createContentDataBuilder(
	websiteId: string,
	startDate: string,
	endDate: string,
	domain: string,
	limit = 100,
) {
	const builder = createSqlBuilder();

	const sql = `
    WITH pages_data AS (
      SELECT
        'page' as type,
        path,
        '' as referrer,
        COUNT(*) as pageviews,
        COUNT(DISTINCT anonymous_id) as visitors,
        AVG(CASE WHEN time_on_page > 0 AND time_on_page IS NOT NULL THEN time_on_page / 1000 ELSE NULL END) as avg_time_on_page
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND time >= parseDateTimeBestEffort('${startDate}')
        AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
        AND event_name = 'screen_view'
      GROUP BY path
    ),
    referrers_data AS (
      SELECT
        'referrer' as type,
        '' as path,
        CASE
          WHEN referrer = '' OR referrer IS NULL THEN 'direct'
          ${domain ? `WHEN referrer LIKE '%${domain}%' THEN 'direct'` : ""}
          ELSE referrer
        END as referrer,
        COUNT(*) as pageviews,
        COUNT(DISTINCT anonymous_id) as visitors,
        null as avg_time_on_page
      FROM analytics.events
      WHERE 
        client_id = '${websiteId}'
        AND time >= parseDateTimeBestEffort('${startDate}')
        AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
        AND event_name = 'screen_view'
      GROUP BY referrer
    )
    SELECT * FROM pages_data
    UNION ALL
    SELECT * FROM referrers_data
    ORDER BY visitors DESC, pageviews DESC
    ${limit ? `LIMIT ${limit}` : ""}
  `;

	builder.getSql = () => sql;
	return builder;
}

/**
 * Creates a combined builder for geographic information
 * Replaces: createCountriesBuilder, createLanguagesBuilder, createTimezonesBuilder
 */
export function createGeoInfoBuilder(
	websiteId: string,
	startDate: string,
	endDate: string,
	limit = 50,
) {
	const builder = createSqlBuilder();

	const sql = `
    SELECT
      COALESCE(country, 'Unknown') as country,
      COALESCE(language, 'Unknown') as language,
      COALESCE(timezone, 'Unknown') as timezone,
      COUNT(DISTINCT anonymous_id) as visitors,
      COUNT(*) as pageviews
    FROM analytics.events
    WHERE 
      client_id = '${websiteId}'
      AND time >= parseDateTimeBestEffort('${startDate}')
      AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
      AND event_name = 'screen_view'
    GROUP BY 
      country,
      language,
      timezone
    ORDER BY visitors DESC, pageviews DESC
    ${limit ? `LIMIT ${limit}` : ""}
  `;

	builder.getSql = () => sql;
	return builder;
}
