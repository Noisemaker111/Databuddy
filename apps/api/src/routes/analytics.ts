/**
 * Analytics Dashboard Data API
 * 
 * Provides endpoints for retrieving aggregated analytics data for website dashboards.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { chQuery } from '@databuddy/db';
import type { AppVariables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { 
  formatTime, 
  formatPerformanceMetric, 
  getDefaultDateRange, 
  formatCleanPath,
  formatBrowserData,
  formatDeviceData
} from '../utils/analytics-helpers';
import {
  createSummaryBuilder, 
  createTodayBuilder, 
  createTodayByHourBuilder,
  createTopPagesBuilder, 
  createTopReferrersBuilder, 
  createEventsByDateBuilder,
  createScreenResolutionsBuilder,
  createBrowserVersionsBuilder,
  createCountriesBuilder,
  createDeviceTypesBuilder,
  createConnectionTypesBuilder,
  createLanguagesBuilder,
  createTimezonesBuilder,
  createPerformanceBuilder,
  parseReferrers
} from '../builders/analytics';
import {
  mergeTodayDataIntoSummary,
  updateEventsWithTodayData,
  mergeTodayIntoTrends
} from '../utils/today-data-processor';
import { logger } from '../lib/logger';
import { websiteAuthHook } from '../middleware/website';
import { isInternalReferrer } from '../utils/referrer';

// Define types for data processing
interface ReferrerData {
  referrer: string;
  visitors: number;
  pageviews: number;
}


interface PageData {
  path: string;
  pageviews: number;
  visitors: number;
  avg_time_on_page: number | null;
}

interface AnalyticsEntry {
  date: string;
  pageviews: number;
  unique_visitors?: number;
  visitors?: number;
  sessions: number;
  bounce_rate: number;
  avg_session_duration?: number;
  [key: string]: any;
}


// Create router with typed context
export const analyticsRouter = new Hono<{ 
  Variables: AppVariables & { 
    user?: { id: string, email: string } | null;
    session?: any;
  }
}>();

// Apply auth middleware to all routes
analyticsRouter.use('*', authMiddleware);
analyticsRouter.use('*', websiteAuthHook);

// Validation schema for analytics query parameters
const analyticsQuerySchema = z.object({
  website_id: z.string().min(1, 'Website ID is required'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  interval: z.enum(['day', 'week', 'month', 'auto']).default('day'),
  granularity: z.enum(['daily', 'hourly']).default('daily'),
  limit: z.coerce.number().int().min(1).max(1000).default(30),
});

/**
 * Get summary statistics
 * GET /analytics/summary
 */
analyticsRouter.get('/summary', zValidator('query', analyticsQuerySchema), async (c) => {
  const params = c.req.valid('query');
  const user = c.get('user');
  const website = c.get('website');

  if (!website || !website.id) {
    return c.json({ error: 'Website not found' }, 404);
  }
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  try {
    // Set default date range if not provided
    const { startDate, endDate } = getDefaultDateRange(params.end_date, params.start_date);
    const todayDateStr = new Date().toISOString().split('T')[0];
    
    // Use our builders for all queries
    const summaryBuilder = createSummaryBuilder(params.website_id, startDate, endDate);
    const todayBuilder = createTodayBuilder(params.website_id);
    const todayByHourBuilder = createTodayByHourBuilder(params.website_id);
    const topPagesBuilder = createTopPagesBuilder(params.website_id, startDate, endDate, 100);
    const topReferrersBuilder = createTopReferrersBuilder(params.website_id, startDate, endDate, website.domain);
    const eventsByDateBuilder = createEventsByDateBuilder(
      params.website_id, 
      startDate, 
      endDate, 
      params.granularity as 'hourly' | 'daily'
    );
    const resolutionsBuilder = createScreenResolutionsBuilder(params.website_id, startDate, endDate, 6);
    const browserVersionsBuilder = createBrowserVersionsBuilder(params.website_id, startDate, endDate, 5);
    const countriesBuilder = createCountriesBuilder(params.website_id, startDate, endDate, 5);
    const deviceTypesBuilder = createDeviceTypesBuilder(params.website_id, startDate, endDate, 100);
    const connectionTypesBuilder = createConnectionTypesBuilder(params.website_id, startDate, endDate, 5);
    const languagesBuilder = createLanguagesBuilder(params.website_id, startDate, endDate, 5);
    const timezonesBuilder = createTimezonesBuilder(params.website_id, startDate, endDate, 5);
    const performanceBuilder = createPerformanceBuilder(params.website_id, startDate, endDate);

    // Execute all queries
    const [
      summaryData, 
      todayData, 
      todayHourlyData,
      topPages, 
      topReferrers, 
      eventsByDate, 
      resolutions,
      browserVersions,
      countries,
      deviceTypeResults,
      connectionTypes,
      languages,
      timezones,
      performance,
    ] = await Promise.all([
      chQuery(summaryBuilder.getSql()),
      chQuery(todayBuilder.getSql()),
      chQuery(todayByHourBuilder.getSql()),
      chQuery(topPagesBuilder.getSql()),
      chQuery(topReferrersBuilder.getSql()),
      chQuery(eventsByDateBuilder.getSql()),
      chQuery(resolutionsBuilder.getSql()),
      chQuery(browserVersionsBuilder.getSql()),
      chQuery(countriesBuilder.getSql()),
      chQuery(deviceTypesBuilder.getSql()),
      chQuery(connectionTypesBuilder.getSql()),
      chQuery(languagesBuilder.getSql()),
      chQuery(timezonesBuilder.getSql()),
      chQuery(performanceBuilder.getSql()),
    ]);
    
    if (!website) {
      return c.json({ error: 'Website not found' }, 404);
    }
    
    // Process today's summary data directly from the todayBuilder result
    const rawTodaySummary = todayData?.[0] || {
      pageviews: 0,
      unique_visitors: 0,
      sessions: 0,
      bounce_rate: 0,
      avg_session_duration: 0
    };

    const todaySummary = {
      pageviews: rawTodaySummary.pageviews || 0,
      visitors: rawTodaySummary.unique_visitors || 0, // createTodayBuilder uses 'unique_visitors'
      sessions: rawTodaySummary.sessions || 0,
      bounce_rate: rawTodaySummary.bounce_rate || 0,
      bounce_rate_pct: `${Math.round((rawTodaySummary.bounce_rate || 0) * 10) / 10}%`,
      // avg_session_duration is already provided by todayBuilder, ensure it's handled if needed later for todaySummary object
      // For now, keeping it consistent with previous structure where avg_session_duration was part of the main summary, not specifically 'todaySummary' display object
    };
    
    // Process browser data to include browser version and OS info
    const processedBrowserVersions = browserVersions.length > 0 ? formatBrowserData(browserVersions as Array<{ 
      browser_name: string; 
      browser_version: string; 
      os_name: string;
      os_version: string;
      count: number; 
      visitors: number 
    }>) : [];
    
    // Process device types
    const deviceTypes = formatDeviceData(deviceTypeResults as Array<{ device_type: string; device_brand: string; device_model: string; visitors: number; pageviews: number }>);
    
    // Sort device types by visitors
    deviceTypes.sort((a: { visitors: number }, b: { visitors: number }) => b.visitors - a.visitors);
    
    // Process countries to replace empty values with "Unknown"
    const processedCountries = countries.map(country => ({
      ...country,
      country: country.country?.trim() ? country.country : 'Unknown'
    }));
    
    // Use utility to merge today's data with historical data
    const summary = mergeTodayDataIntoSummary(summaryData[0], todaySummary);
    
    // Update events_by_date to include today's data
    const updatedEventsByDate = updateEventsWithTodayData(
      eventsByDate as AnalyticsEntry[], 
      todaySummary,
      params.granularity as 'hourly' | 'daily'
    );

    // Process top pages data first for clarity before conditional logic
    const allProcessedTopPages = topPages.map(page => {
      const cleanPath = formatCleanPath(page.path);
      const timeOnPage = page.avg_time_on_page;
      return {
        pageviews: page.pageviews,
        visitors: page.visitors,
        path: cleanPath,
        avg_time_on_page: timeOnPage,
        avg_time_on_page_formatted: formatTime(timeOnPage === null ? null : timeOnPage)
      } as PageData & { avg_time_on_page_formatted: string };
    });
    
    // Process referrer data first for clarity before conditional logic
    const allProcessedReferrers = parseReferrers(
      topReferrers as ReferrerData[],
      true, 
      (referrer) => isInternalReferrer(referrer, website.domain),
      website.domain
    );

    // Group referrers by domain and aggregate metrics
    const groupedReferrers = new Map();
    
    for (const ref of allProcessedReferrers) {
      if (ref.referrer === 'direct') continue; // Skip direct traffic
      
      const domain = ref.domain || '';
      if (!domain) continue;
      
      if (groupedReferrers.has(domain)) {
        const existing = groupedReferrers.get(domain);
        existing.visitors += ref.visitors;
        existing.pageviews += ref.pageviews;
      } else {
        groupedReferrers.set(domain, {
          referrer: ref.referrer,
          visitors: ref.visitors,
          pageviews: ref.pageviews,
          type: ref.type,
          name: ref.name,
          domain: ref.domain
        });
      }
    }
    
    // Convert to array, sort by visitors, and take top 5
    const finalTopReferrers = Array.from(groupedReferrers.values())
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 100);

    let finalTopPages: Array<PageData & { avg_time_on_page_formatted: string }>;
    if (endDate === todayDateStr && params.start_date === todayDateStr) {
      const todayOnlyPagesBuilder = createTopPagesBuilder(params.website_id, todayDateStr, todayDateStr, 100);
      const todayOnlyTopPagesResult = await chQuery(todayOnlyPagesBuilder.getSql());
      finalTopPages = todayOnlyTopPagesResult.map(page => {
        const cleanPath = formatCleanPath(page.path);
        const timeOnPage = page.avg_time_on_page;
        return {
          pageviews: page.pageviews,
          visitors: page.visitors,
          path: cleanPath,
          avg_time_on_page: timeOnPage,
          avg_time_on_page_formatted: formatTime(timeOnPage === null ? null : timeOnPage)
        } as PageData & { avg_time_on_page_formatted: string };
      }).sort((a, b) => b.pageviews - a.pageviews).slice(0, 100);
    } else {
      finalTopPages = allProcessedTopPages.sort((a, b) => b.pageviews - a.pageviews).slice(0, 100);
    }
    
    return c.json({
      success: true,
      website_id: params.website_id,
      date_range: {
        start_date: startDate,
        end_date: endDate,
        granularity: params.granularity
      },
      summary: {
        pageviews: summary.pageviews,
        visitors: summary.unique_visitors,
        unique_visitors: summary.unique_visitors,
        sessions: summary.sessions,
        bounce_rate: summary.bounce_rate,
        bounce_rate_pct: `${Math.round(summary.bounce_rate * 10) / 10}%`,
        avg_session_duration: Math.round(summary.avg_session_duration),
        avg_session_duration_formatted: formatTime(summary.avg_session_duration)
      },
      events_by_date: updatedEventsByDate.map((day: AnalyticsEntry) => ({
        ...day,
        bounce_rate_pct: `${Math.round(day.bounce_rate * 10) / 10}%`,
        avg_session_duration_formatted: formatTime(day.avg_session_duration || 0)
      })),
      
      // Use our calculated today summary instead of just today's raw data
      today: todaySummary,
      
      top_pages: finalTopPages,
      top_referrers: finalTopReferrers,
      screen_resolutions: resolutions,
      browser_versions: processedBrowserVersions,
      countries: processedCountries,
      device_types: deviceTypes.slice(0, 100),
      connection_types: connectionTypes,
      languages: languages,
      timezones: timezones,
      performance: {
        avg_load_time: performance[0]?.avg_load_time !== undefined && performance[0]?.avg_load_time !== null ? Math.round(performance[0].avg_load_time) : null,
        avg_ttfb: performance[0]?.avg_ttfb !== undefined && performance[0]?.avg_ttfb !== null ? Math.round(performance[0].avg_ttfb) : null,
        avg_dom_ready_time: performance[0]?.avg_dom_ready_time !== undefined && performance[0]?.avg_dom_ready_time !== null ? Math.round(performance[0].avg_dom_ready_time) : null,
        avg_render_time: performance[0]?.avg_render_time !== undefined && performance[0]?.avg_render_time !== null ? Math.round(performance[0].avg_render_time) : null,
        avg_fcp: performance[0]?.avg_fcp !== undefined && performance[0]?.avg_fcp !== null ? Math.round(performance[0].avg_fcp) : null,
        avg_lcp: performance[0]?.avg_lcp !== undefined && performance[0]?.avg_lcp !== null ? Math.round(performance[0].avg_lcp) : null,
        avg_cls: performance[0]?.avg_cls !== undefined && performance[0]?.avg_cls !== null ? Math.round((performance[0].avg_cls) * 1000) / 1000 : null,
        avg_load_time_formatted: formatPerformanceMetric(performance[0]?.avg_load_time === null ? null : performance[0]?.avg_load_time || 0),
        avg_ttfb_formatted: formatPerformanceMetric(performance[0]?.avg_ttfb === null ? null : performance[0]?.avg_ttfb || 0),
        avg_dom_ready_time_formatted: formatPerformanceMetric(performance[0]?.avg_dom_ready_time === null ? null : performance[0]?.avg_dom_ready_time || 0),
        avg_render_time_formatted: formatPerformanceMetric(performance[0]?.avg_render_time === null ? null : performance[0]?.avg_render_time || 0),
        avg_fcp_formatted: formatPerformanceMetric(performance[0]?.avg_fcp === null ? null : performance[0]?.avg_fcp || 0),
        avg_lcp_formatted: formatPerformanceMetric(performance[0]?.avg_lcp === null ? null : performance[0]?.avg_lcp || 0),
        avg_cls_formatted: formatPerformanceMetric(performance[0]?.avg_cls === null ? null : performance[0]?.avg_cls || 0, '')
      }
    });
  } catch (error) {
    logger.error('Error retrieving summary analytics data', { 
      error,
      website_id: params.website_id
    });
    
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, 500);
  }
});

import miniChartRouter from './mini-chart';
import sessionsRouter from './sessions';
import profilesRouter from './profiles';

analyticsRouter.route('/mini-chart', miniChartRouter);
analyticsRouter.route('/sessions', sessionsRouter);
analyticsRouter.route('/profiles', profilesRouter);

export default analyticsRouter; 