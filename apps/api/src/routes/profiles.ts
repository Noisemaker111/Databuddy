import { chQuery, createSqlBuilder } from "../clickhouse/client";
import { parseReferrers } from "../builders";
import { logger } from "../lib/logger";
import { formatDuration } from "../utils/dates";
import { generateSessionName } from "../utils/sessions";
import { parseUserAgentDetails } from "../utils/ua";
import { Hono } from "hono";
import type { AppVariables } from "../types";
import type { Session, User } from "@databuddy/auth";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const profilesRouter = new Hono<{ 
    Variables: AppVariables & { 
        user?: User
        session?: Session;
    }
}>();

const analyticsQuerySchema = z.object({
    website_id: z.string().min(1, 'Website ID is required'),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
    interval: z.enum(['day', 'week', 'month', 'auto']).default('day'),
    granularity: z.enum(['daily', 'hourly']).default('daily'),
    limit: z.coerce.number().int().min(1).max(1000).default(30),
  });

// GET /analytics/profiles - retrieves visitor profiles with their sessions
profilesRouter.get('/', zValidator('query', analyticsQuerySchema), async (c) => {
    const params = c.req.valid('query');
    const user = c.get('user');
    
    if (!user) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }
  
    try {
      // Set default date range if not provided
      const endDate = params.end_date || new Date().toISOString().split('T')[0];
      const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const profilesLimit = params.limit;
      
      // First, get all unique visitor IDs
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
        date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`
      };
      visitorIdsBuilder.sb.groupBy = {
        visitor_id: 'anonymous_id'
      };
      visitorIdsBuilder.sb.orderBy = {
        session_count: 'session_count DESC',
        last_visit: 'last_visit DESC'
      };
      visitorIdsBuilder.sb.limit = profilesLimit;
      
      const visitorIdsResult = await chQuery(visitorIdsBuilder.getSql());
      
      if (!visitorIdsResult.length) {
        return c.json({
          success: true,
          profiles: [],
          date_range: {
            start_date: startDate,
            end_date: endDate
          },
          total_visitors: 0,
          returning_visitors: 0
        });
      }
      
      // Get all sessions for these visitors
      const sessions = [];
      const profiles = [];
      
      // Get the count of all visitors and returning visitors
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
      
      // Process each visitor
      for (const visitor of visitorIdsResult) {
        // Get sessions for this visitor
        const visitorSessionsBuilder = createSqlBuilder();
        visitorSessionsBuilder.sb.select = {
          session_id: 'session_id',
          first_visit: 'MIN(time) as first_visit',
          last_visit: 'MAX(time) as last_visit',
          duration: 'dateDiff(\'second\', MIN(time), MAX(time)) as duration',
          page_views: 'countIf(event_name = \'screen_view\') as page_views',
          user_agent: 'any(user_agent) as user_agent',
          country: 'any(country) as country',
          city: 'any(city) as city',
          referrer: 'any(referrer) as referrer'
        };
        visitorSessionsBuilder.sb.from = 'analytics.events';
        visitorSessionsBuilder.sb.where = {
          client_filter: `client_id = '${params.website_id}'`,
          date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
          visitor_filter: `anonymous_id = '${visitor.visitor_id}'`
        };
        visitorSessionsBuilder.sb.groupBy = {
          session_id: 'session_id'
        };
        visitorSessionsBuilder.sb.orderBy = {
          first_visit: 'first_visit DESC'
        };
        
        const visitorSessionsResult = await chQuery(visitorSessionsBuilder.getSql());
        
        if (!visitorSessionsResult.length) {
          continue;
        }
        
        // Format the visitor's sessions
        const formattedSessions = visitorSessionsResult.map(session => {
          // Format the duration as Xh Ym Zs
          const durationInSeconds = session.duration || 0;
          const durationFormatted = formatDuration(durationInSeconds);
          
          // Parse user agent
          const userAgentInfo = parseUserAgentDetails(session.user_agent || '');
          
          // Parse referrer if present
          const referrerParsed = session.referrer ? parseReferrers(
            [{ referrer: session.referrer, visitors: 0, pageviews: 0 }]
          )[0] : null;
          
          // Generate a session name
          const sessionName = generateSessionName(session.session_id);
          
          return {
            ...session,
            session_name: sessionName,
            device: userAgentInfo.device_type,
            browser: userAgentInfo.browser_name,
            os: userAgentInfo.os_name,
            duration_formatted: durationFormatted,
            referrer_parsed: referrerParsed,
            visitor_id: visitor.visitor_id,
            is_returning_visitor: visitor.session_count > 1,
            visitor_session_count: visitor.session_count
          };
        }) as Array<typeof visitorSessionsResult[0] & {
          session_name: string;
          device: string;
          browser: string;
          os: string;
          duration_formatted: string;
          referrer_parsed: { type: string; name: string; domain: string; referrer: string; visitors: number; pageviews: number; } | null;
          visitor_id: string;
          is_returning_visitor: boolean;
          visitor_session_count: number;
          duration: number;
          page_views: number;
          country: string;
          city: string;
        }>;
        
        // Add sessions to the overall sessions array
        sessions.push(...formattedSessions);
        
        // Calculate total duration across all sessions
        const totalDuration = formattedSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        const totalDurationFormatted = formatDuration(totalDuration);
        
        // Get the most recent session for device info
        const latestSession = formattedSessions[0];
        
        // Create profile data
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
          country: latestSession?.country || 'Unknown',
          city: latestSession?.city || 'Unknown',
          sessions: formattedSessions
        };
        
        profiles.push(profile);
      }
      
      return c.json({
        success: true,
        profiles,
        date_range: {
          start_date: startDate,
          end_date: endDate
        },
        total_visitors: totalVisitors,
        returning_visitors: returningVisitors
      });
    } catch (error) {
      logger.error('Error retrieving visitor profiles:', { 
        error,
        website_id: params.website_id
      });
      
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve visitor profiles.'
      }, 400);
    }
  });
  
  export default profilesRouter;