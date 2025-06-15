import { chQuery } from "@databuddy/db";
import { createSqlBuilder } from "../../builders/analytics";
import { logger } from "../../lib/logger";
import { formatDuration } from "../../utils/dates";
import { generateSessionName } from "../../utils/sessions";
import { parseUserAgentDetails } from "../../utils/ua";
import { timezoneMiddleware, useTimezone, timezoneQuerySchema } from "../../middleware/timezone";
import { Context, Hono } from "hono";
import type { AppVariables } from "../../types";
import { parseReferrer } from "../../utils/referrer";

const profilesRouter = new Hono<{ Variables: AppVariables }>();

const mapCountryCode = (country: string): string => {
  return country === 'IL' ? 'PS' : country;
};

profilesRouter.use('*', timezoneMiddleware);

profilesRouter.get('/', async (c: Context) => {
    const params = await c.req.query();
    const timezoneInfo = useTimezone(c);
    if (!params.page) {
        return c.json({
            success: false,
            error: "Page is required"
        }, 400);
    }
    
    try {
      const endDate = params.end_date || new Date().toISOString().split('T')[0];
      const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const profilesLimit = params.limit;
      const page = params.page || 1;
      const offset = (Number(page) - 1) * Number(profilesLimit);
      
      // 1. Get paginated unique visitor IDs with their basic stats
      const visitorIdsBuilder = createSqlBuilder();
      visitorIdsBuilder.sb.select = {
        visitor_id: 'anonymous_id as visitor_id',
        session_count: 'uniqExact(session_id) as session_count',
        first_visit: 'MIN(time) as first_visit',
        last_visit: 'MAX(time) as last_visit'
      };
      visitorIdsBuilder.sb.from = 'analytics.events';
      visitorIdsBuilder.sb.where = {
        client_filter: `client_id = '${params.website_id}'`,
        date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59' )`
      };
      visitorIdsBuilder.sb.groupBy = { visitor_id: 'anonymous_id' };
      visitorIdsBuilder.sb.orderBy = { last_visit: 'last_visit DESC', session_count: 'session_count DESC' };
      visitorIdsBuilder.sb.limit = Number(profilesLimit);
      visitorIdsBuilder.sb.offset = offset;
      
      const visitorIdsResult = await chQuery(visitorIdsBuilder.getSql());
      
      if (!visitorIdsResult.length) {
        return c.json({
          success: true,
          profiles: [],
          date_range: { start_date: startDate, end_date: endDate },
          total_visitors: 0,
          returning_visitors: 0,
          pagination: { page: Number(page), limit: Number(profilesLimit), hasNext: false,  hasPrev: Number(page) > 1 },
          timezone: { timezone: timezoneInfo.timezone, detected: timezoneInfo.detected, source: timezoneInfo.source }
        });
      }
      
      const visitorIdList = visitorIdsResult.map(v => v.visitor_id);

      // 2. Get all sessions with their events for these specific visitor IDs
      const sessionsWithEventsBuilder = createSqlBuilder();
      const sessionsWithEventsSql = `
        WITH session_list AS (
          SELECT
            session_id,
            anonymous_id as visitor_id,
            MIN(time) as first_visit,
            MAX(time) as last_visit,
            LEAST(dateDiff('second', MIN(time), MAX(time)), 28800) as duration,
            countIf(event_name = 'screen_view') as page_views,
            any(user_agent) as user_agent,
            any(country) as country,
            any(region) as region,
            any(referrer) as referrer
          FROM analytics.events
          WHERE 
            client_id = '${params.website_id}'
            AND time >= parseDateTimeBestEffort('${startDate}')
            AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
            AND anonymous_id IN (${visitorIdList.map(id => `'${id}'`).join(',')})
          GROUP BY session_id, anonymous_id
          ORDER BY visitor_id, first_visit DESC
        ),
        session_events AS (
          SELECT
            e.session_id,
            groupArray(
              tuple(
                e.id,
                e.time,
                e.event_name,
                e.path,
                e.error_message,
                e.error_type,
                CASE 
                  WHEN e.event_name NOT IN ('screen_view', 'page_exit', 'error', 'web_vitals', 'link_out') 
                    AND e.properties IS NOT NULL 
                    AND e.properties != '{}' 
                  THEN CAST(e.properties AS String)
                  ELSE NULL
                END
              )
            ) as events
          FROM analytics.events e
          INNER JOIN session_list sl ON e.session_id = sl.session_id
          WHERE e.client_id = '${params.website_id}'
          GROUP BY e.session_id
        )
        SELECT
          sl.session_id,
          sl.visitor_id,
          sl.first_visit,
          sl.last_visit,
          sl.duration,
          sl.page_views,
          sl.user_agent,
          sl.country,
          sl.region,
          sl.referrer,
          COALESCE(se.events, []) as events
        FROM session_list sl
        LEFT JOIN session_events se ON sl.session_id = se.session_id
        ORDER BY sl.visitor_id, sl.first_visit DESC
      `;

      const allSessionsResult = await chQuery(sessionsWithEventsSql);

      const sessionsByVisitor: Record<string, any[]> = {};
      for (const session of allSessionsResult) {
        if (!sessionsByVisitor[session.visitor_id]) {
            sessionsByVisitor[session.visitor_id] = [];
        }
        sessionsByVisitor[session.visitor_id].push(session);
      }
      
      // 3. Get overall visitor stats for the date range
      const visitorStatsBuilder = createSqlBuilder();
      visitorStatsBuilder.sb.select = {
        total_visitors: 'uniqExact(anonymous_id) as total_visitors',
        returning_visitors: 'countIf(sessions > 1) as returning_visitors'
      };
      visitorStatsBuilder.sb.from = `(
        SELECT 
          anonymous_id, 
          COUNT(DISTINCT session_id) as sessions
        FROM analytics.events
        WHERE 
          client_id = '${params.website_id}'
          AND time >= parseDateTimeBestEffort('${startDate}')
          AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')
        GROUP BY anonymous_id
      )`;
      
      const visitorStatsResult = await chQuery(visitorStatsBuilder.getSql());
      const totalVisitors = visitorStatsResult[0]?.total_visitors || 0;
      const returningVisitors = visitorStatsResult[0]?.returning_visitors || 0;
      
      // 4. Construct profiles with their sessions and events
      const profiles = [];
      for (const visitor of visitorIdsResult) {
        const visitorSessions = sessionsByVisitor[visitor.visitor_id] || [];
        
        const formattedSessions = visitorSessions.map(session => {
          const durationInSeconds = session.duration || 0;
          const durationFormatted = formatDuration(durationInSeconds);
          const userAgentInfo = parseUserAgentDetails(session.user_agent || '');
          const referrerInfo = parseReferrer(session.referrer, undefined);
          const sessionName = generateSessionName(session.session_id);
          
          // Process events similar to sessions API
          let processedEvents: any[] = [];
          if (session.events && Array.isArray(session.events)) {
            processedEvents = session.events.map((eventTuple: any) => {
              const [
                event_id,
                time,
                event_name,
                path,
                error_message,
                error_type,
                properties_json
              ] = eventTuple;
              
              let properties: Record<string, any> = {};
              if (properties_json) {
                try {
                  properties = JSON.parse(properties_json);
                } catch {
                  // If parsing fails, keep empty object
                }
              }
              
              return {
                event_id,
                time,
                event_name,
                path,
                error_message,
                error_type,
                properties
              };
            }).filter((event: any) => event.event_id);
          }
          
          return {
            session_id: session.session_id,
            session_name: sessionName,
            first_visit: session.first_visit,
            last_visit: session.last_visit,
            duration: session.duration,
            duration_formatted: durationFormatted,
            page_views: session.page_views,
            device: userAgentInfo.device_type,
            browser: userAgentInfo.browser_name,
            os: userAgentInfo.os_name,
            country: mapCountryCode(session.country || ''),
            region: session.region,
            referrer: session.referrer,
            referrer_parsed: session.referrer ? {
              type: referrerInfo.type,
              name: referrerInfo.name,
              domain: referrerInfo.domain,
            } : null,
            visitor_id: visitor.visitor_id,
            is_returning_visitor: visitor.session_count > 1,
            visitor_session_count: visitor.session_count,
            events: processedEvents
          };
        }) as Array<any>; 
        
        const totalDuration = formattedSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        const totalDurationFormatted = formatDuration(totalDuration);
        const latestSession = formattedSessions[0];
        
        const profile = {
          visitor_id: visitor.visitor_id,
          first_visit: visitor.first_visit,
          last_visit: visitor.last_visit,
          total_sessions: visitor.session_count,
          total_pageviews: formattedSessions.reduce((sum, session) => sum + (session.page_views || 0), 0),
          total_duration: totalDuration,
          total_duration_formatted: totalDurationFormatted,
          device: latestSession?.device || 'Unknown',
          browser: latestSession?.browser || 'Unknown',
          os: latestSession?.os || 'Unknown',
          country: mapCountryCode(latestSession?.country || 'Unknown'),
          region: latestSession?.region || 'Unknown',
          sessions: formattedSessions
        };
        
        profiles.push(profile);
      }
      
      const hasNext = Number(page) * Number(profilesLimit) < totalVisitors;

      return c.json({
        success: true,
        profiles,
        date_range: { start_date: startDate, end_date: endDate },
        total_visitors: totalVisitors, 
        returning_visitors: returningVisitors,
        pagination: { page: Number(page), limit: Number(profilesLimit), hasNext, hasPrev: Number(page) > 1 },
        timezone: { timezone: timezoneInfo.timezone, detected: timezoneInfo.detected, source: timezoneInfo.source }
      });
    } catch (error) {
      logger.error('Error retrieving visitor profiles:', { 
        error,
        website_id: params.website_id
      });
      
      return c.json({
        success: false,
        error: "Error retrieving visitor profiles"
      }, 500);
    }
  });
  
  export default profilesRouter;