import { createSqlBuilder } from "../builders/analytics";

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { AppVariables } from "../types";
import { timezoneQuerySchema } from "../middleware/timezone";
import { z } from "zod";
import { logger } from "../lib/logger";
import { chQuery } from "@databuddy/db";

export const errorsRouter = new Hono<{ Variables: AppVariables }>();

const analyticsQuerySchema = z.object({
    website_id: z.string().min(1, 'Website ID is required'),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
    interval: z.enum(['day', 'week', 'month', 'auto']).default('day'),
    granularity: z.enum(['daily', 'hourly']).default('daily'),
    limit: z.coerce.number().int().min(1).max(1000).default(30),
}).merge(timezoneQuerySchema);

// Helper function to create error types builder
function createErrorTypesBuilder(websiteId: string, startDate: string, endDate: string, limit: number) {
  const builder = createSqlBuilder('events');
  
  builder.sb.select = {
    error_type: 'COALESCE(error_type, \'Unknown\') as error_type',
    count: 'COUNT(*) as count',
    unique_sessions: 'COUNT(DISTINCT session_id) as unique_sessions'
  };
  
  builder.sb.where = {
    client_filter: `client_id = '${websiteId}'`,
    date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
    event_filter: "event_name = 'error'"
  };
  
  builder.sb.groupBy = {
    error_type: 'error_type'
  };
  
  builder.sb.orderBy = {
    count: 'count DESC'
  };
  
  builder.sb.limit = limit;
  
  return builder;
}

// Helper function to create error timeline builder
function createErrorTimelineBuilder(websiteId: string, startDate: string, endDate: string) {
  const builder = createSqlBuilder('events');
  
  builder.sb.select = {
    date: 'toDate(time) as date',
    error_type: 'COALESCE(error_type, \'Unknown\') as error_type',
    count: 'COUNT(*) as count'
  };
  
  builder.sb.where = {
    client_filter: `client_id = '${websiteId}'`,
    date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
    event_filter: "event_name = 'error'"
  };
  
  builder.sb.groupBy = {
    date: 'date',
    error_type: 'error_type'
  };
  
  builder.sb.orderBy = {
    date: 'date ASC'
  };
  
  return builder;
}

// Helper function to create error details builder
function createErrorDetailsBuilder(websiteId: string, startDate: string, endDate: string, limit: number) {
  const builder = createSqlBuilder('events');
  
  builder.sb.select = {
    time: 'time',
    error_type: 'COALESCE(error_type, \'Unknown\') as error_type',
    error_message: 'COALESCE(error_message, \'\') as error_message',
    error_stack: 'COALESCE(error_stack, \'\') as error_stack',
    page_url: 'COALESCE(page_url, \'\') as page_url',
    user_agent: 'COALESCE(user_agent, \'\') as user_agent',
    session_id: 'session_id',
    anonymous_id: 'anonymous_id',
    country: 'COALESCE(country, \'Unknown\') as country',
    city: 'COALESCE(city, \'Unknown\') as city'
  };
  
  builder.sb.where = {
    client_filter: `client_id = '${websiteId}'`,
    date_filter: `time >= parseDateTimeBestEffort('${startDate}') AND time <= parseDateTimeBestEffort('${endDate} 23:59:59')`,
    event_filter: "event_name = 'error'"
  };
  
  builder.sb.orderBy = {
    time: 'time DESC'
  };
  
  builder.sb.limit = limit;
  
  return builder;
}

// Helper function to parse user agent details
function parseUserAgentDetails(userAgent: string) {
  // Simple user agent parsing - in production you might want to use a proper library
  const browser_name = userAgent.includes('Chrome') ? 'Chrome' :
                      userAgent.includes('Firefox') ? 'Firefox' :
                      userAgent.includes('Safari') ? 'Safari' :
                      userAgent.includes('Edge') ? 'Edge' : 'Unknown';
  
  const os_name = userAgent.includes('Windows') ? 'Windows' :
                 userAgent.includes('Mac') ? 'macOS' :
                 userAgent.includes('Linux') ? 'Linux' :
                 userAgent.includes('Android') ? 'Android' :
                 userAgent.includes('iOS') ? 'iOS' : 'Unknown';
  
  const device_type = userAgent.includes('Mobile') ? 'Mobile' :
                     userAgent.includes('Tablet') ? 'Tablet' : 'Desktop';
  
  return { browser_name, os_name, device_type };
}

errorsRouter.get('/', zValidator('query', analyticsQuerySchema), async (c) => {
  const params = c.req.valid('query');
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    const endDate = params.end_date || new Date().toISOString().split('T')[0];
    const startDate = params.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Use our builders for error analytics
    const errorTypesBuilder = createErrorTypesBuilder(params.website_id, startDate, endDate, params.limit);
    const errorsTimeBuilder = createErrorTimelineBuilder(params.website_id, startDate, endDate);
    const errorDetailsBuilder = createErrorDetailsBuilder(params.website_id, startDate, endDate, 100);
    
    const errorTypes = await chQuery(errorTypesBuilder.getSql());
    const errorsOverTime = await chQuery(errorsTimeBuilder.getSql());
    const errorDetails = await chQuery(errorDetailsBuilder.getSql());
    
    // Process errors over time to create a time series format
    interface TimeSeriesPoint {
      [key: string]: string | number;
    }
    
    const timeSeriesData: Record<string, TimeSeriesPoint> = {};
    
    for (const error of errorsOverTime) {
      const date = error.date as string;
      const errorType = error.error_type as string;
      const count = error.count as number;
      
      if (!timeSeriesData[date]) {
        timeSeriesData[date] = { date };
      }
      
      timeSeriesData[date][errorType] = count;
    }
    
    const timeSeriesArray = Object.values(timeSeriesData);
    
    // Process error details to include browser, OS, and device information
    const processedErrorDetails = errorDetails.map(error => {
      const userAgentInfo = parseUserAgentDetails(error.user_agent as string);
      
      return {
        ...error,
        browser: userAgentInfo.browser_name,
        os: userAgentInfo.os_name,
        device_type: userAgentInfo.device_type
      };
    });
    
    return c.json({
      success: true,
      website_id: params.website_id,
      date_range: {
        start_date: startDate,
        end_date: endDate
      },
      error_types: errorTypes,
      errors_over_time: timeSeriesArray,
      recent_errors: processedErrorDetails
    });
  } catch (error) {
    logger.error('Error retrieving error analytics data', { 
      error,
      website_id: params.website_id
    });
    
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, 500);
  }
}); 