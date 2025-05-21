import { logger } from "../lib/logger";

import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { AppVariables } from "../types";
import type { Session, User } from "@databuddy/auth";
import { chQuery, createSqlBuilder } from "../clickhouse/client";
import { createSessionEventsBuilder, createSessionsBuilder, parseReferrers } from "../builders";
import { generateSessionName } from "../utils/sessions";
import { z } from "zod";
import { formatDuration } from "../utils/dates";
import { parseUserAgentDetails } from "../utils/ua";

  const sessionsRouter = new Hono<{ 
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
  

  // GET /analytics/sessions - retrieves a list of sessions
  sessionsRouter.get('/', zValidator('query', analyticsQuerySchema), async (c) => {
    const params = c.req.valid('query');
    const user = c.get('user');
    
    if (!user) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }
  
    try {
      // Set default date range if not provided
      const endDate = params.end_date || new Date().toISOString().split('T')[0];
      const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const sessionsLimit = params.limit;
      
      // Create sessions builder and execute
      const sessionsBuilder = createSessionsBuilder(params.website_id, startDate, endDate, sessionsLimit);
      const sessionsResult = await chQuery(sessionsBuilder.getSql());
      
      // Track user profiles - get a list of unique visitor IDs
      const visitorIds = [...new Set(sessionsResult.map(session => session.visitor_id))];
      
      // Create a map of visitor IDs to their session counts
      const visitorSessionCounts: Record<string, number> = {};
      for (const session of sessionsResult) { 
        if (session.visitor_id) {
          visitorSessionCounts[session.visitor_id] = (visitorSessionCounts[session.visitor_id] || 0) + 1;
        }
      }
      
      // Format the sessions data
      const formattedSessions = sessionsResult.map(session => {
        // Format the duration as Xh Ym Zs
        const durationInSeconds = session.duration || 0;
        const durationFormatted = formatDuration(durationInSeconds);
        
        // Parse user agent to get device, browser, and OS
        const userAgentInfo = parseUserAgentDetails(session.user_agent || '');
        
        // Parse referrer if present
        const referrerParsed = session.referrer ? parseReferrers(
          [{ referrer: session.referrer, visitors: 0, pageviews: 0 }]
        )[0] : null;
        
        // Generate a session name
        const sessionName = generateSessionName(session.session_id);
        
        // Get the number of sessions for this visitor
        const visitorSessionCount = session.visitor_id ? visitorSessionCounts[session.visitor_id] || 1 : 1;
        
        return {
          ...session,
          session_name: sessionName,
          device: userAgentInfo.device_type,
          browser: userAgentInfo.browser_name,
          os: userAgentInfo.os_name,
          duration_formatted: durationFormatted,
          referrer_parsed: referrerParsed,
          is_returning_visitor: visitorSessionCount > 1,
          visitor_session_count: visitorSessionCount
        };
      });
      
      return c.json({
        success: true,
        sessions: formattedSessions,
        unique_visitors: visitorIds.length,
        date_range: {
          start_date: startDate,
          end_date: endDate
        }
      });
    } catch (error) {
      logger.error('Error retrieving sessions data:', { 
        error,
        website_id: params.website_id
      });
      
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve sessions data.'
      }, 400);
    }
  });
  
  // GET /analytics/session/{session_id} - retrieves details for a specific session
  sessionsRouter.get('/:session_id', zValidator('query', z.object({
    website_id: z.string().min(1, 'Website ID is required')
  })), async (c) => {
    const { session_id } = c.req.param();
    const user = c.get('user');
    const website = c.get('website');
  
    if (!website || !website.id) {
      return c.json({ success: false, error: 'Website not found' }, 404);
    }
  
    if (!user) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }
    
    try {
      // Get the session info first
      const sessionsBuilder = createSessionsBuilder(website.id, '2000-01-01', '2100-01-01', 1);
      sessionsBuilder.sb.where.session_filter = `session_id = '${session_id}'`;
      
      const sessionResult = await chQuery(sessionsBuilder.getSql());
      
      if (!sessionResult.length) {
        return c.json({
          success: false,
          error: 'Session not found'
        }, 404);
      }
      
      const session = sessionResult[0];
      
      // Format the duration
      const durationInSeconds = session.duration || 0;
      const durationFormatted = formatDuration(durationInSeconds);
      
      // Parse user agent to get device, browser, and OS
      const userAgentInfo = parseUserAgentDetails(session.user_agent || '');
      
      // Parse referrer
      const referrerParsed = session.referrer ? parseReferrers(
        [{ referrer: session.referrer, visitors: 0, pageviews: 0 }]
      )[0] : null;
      
      // Get all events for this session
      const eventsBuilder = createSessionEventsBuilder(website.id, session_id);
      const eventsResult = await chQuery(eventsBuilder.getSql());
      
      // Process events to add device, browser, OS info from user_agent
      const processedEvents = eventsResult.map(event => {
        const eventUserAgentInfo = parseUserAgentDetails(event.user_agent || '');
        
        // Create a new object without the user_agent field
        const { user_agent, ...eventWithoutUserAgent } = event;
        
        return {
          ...eventWithoutUserAgent,
          device_type: eventUserAgentInfo.device_type,
          browser: eventUserAgentInfo.browser_name,
          os: eventUserAgentInfo.os_name
        };
      });
      
      // Generate a session name
      const sessionName = generateSessionName(session_id);
      
      // Check if this visitor has other sessions (is a returning visitor)
      const visitorSessionsBuilder = createSqlBuilder();
      visitorSessionsBuilder.sb.select = {
        session_count: 'COUNT(DISTINCT session_id) as session_count'
      };
      visitorSessionsBuilder.sb.from = 'analytics.events';
      visitorSessionsBuilder.sb.where = {
        client_filter: `client_id = '${website.id}'`,
        visitor_filter: `anonymous_id = '${session.visitor_id}'`
      };
      
      const visitorSessionsResult = await chQuery(visitorSessionsBuilder.getSql());
      const visitorSessionCount = visitorSessionsResult[0]?.session_count || 1;
      
      // Format the session with events, but don't include the raw user_agent
      const { user_agent, ...sessionWithoutUserAgent } = session;
      
      const formattedSession = {
        ...sessionWithoutUserAgent,
        session_name: sessionName,
        device: userAgentInfo.device_type,
        browser: userAgentInfo.browser_name,
        os: userAgentInfo.os_name,
        duration_formatted: durationFormatted,
        referrer_parsed: referrerParsed,
        is_returning_visitor: visitorSessionCount > 1,
        visitor_session_count: visitorSessionCount,
        events: processedEvents
      };
      
      return c.json({
        success: true,
        session: formattedSession
      });
    } catch (error) {
      logger.error('Error retrieving session details:', { 
        error,
        website_id: website.id,
        session_id
      });
      
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve session details.'
      }, 400);
    }
  });
  
  export default sessionsRouter;