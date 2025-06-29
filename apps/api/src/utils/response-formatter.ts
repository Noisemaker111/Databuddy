// /**
//  * Response Formatting Utilities
//  *
//  * Handles formatting of analytics response data
//  */

// import { formatTime, formatPerformanceMetric } from './analytics-helpers';
// import type { AnalyticsEntry } from './analytics-timezone';

// /**
//  * Format performance metrics
//  */
// export function formatPerformanceData(performance: any[]) {
//   const perf = performance[0];
//   if (!perf) return {};

//   const getValue = (val: any) => val !== undefined && val !== null ? Math.round(val) : null;
//   const getCLSValue = (val: any) => val !== undefined && val !== null ? Math.round(val * 1000) / 1000 : null;

//   return {
//     avg_load_time: getValue(perf.avg_load_time),
//     avg_ttfb: getValue(perf.avg_ttfb),
//     avg_dom_ready_time: getValue(perf.avg_dom_ready_time),
//     avg_render_time: getValue(perf.avg_render_time),
//     avg_fcp: getValue(perf.avg_fcp),
//     avg_lcp: getValue(perf.avg_lcp),
//     avg_cls: getCLSValue(perf.avg_cls),
//     avg_load_time_formatted: formatPerformanceMetric(perf.avg_load_time || 0),
//     avg_ttfb_formatted: formatPerformanceMetric(perf.avg_ttfb || 0),
//     avg_dom_ready_time_formatted: formatPerformanceMetric(perf.avg_dom_ready_time || 0),
//     avg_render_time_formatted: formatPerformanceMetric(perf.avg_render_time || 0),
//     avg_fcp_formatted: formatPerformanceMetric(perf.avg_fcp || 0),
//     avg_lcp_formatted: formatPerformanceMetric(perf.avg_lcp || 0),
//     avg_cls_formatted: formatPerformanceMetric(perf.avg_cls || 0, '')
//   };
// }

// /**
//  * Format summary data
//  */
// export function formatSummaryData(processedSummary: any) {
//   return {
//     pageviews: processedSummary.pageviews,
//     visitors: processedSummary.unique_visitors,
//     unique_visitors: processedSummary.unique_visitors,
//     sessions: processedSummary.sessions,
//     bounce_rate: processedSummary.bounce_rate,
//     bounce_rate_pct: `${Math.round(processedSummary.bounce_rate * 10) / 10}%`,
//     avg_session_duration: Math.round(processedSummary.avg_session_duration),
//     avg_session_duration_formatted: formatTime(processedSummary.avg_session_duration)
//   };
// }

// /**
//  * Format events by date data
//  */
// export function formatEventsByDate(filteredEvents: AnalyticsEntry[]) {
//   return filteredEvents.map((day: AnalyticsEntry) => ({
//     ...day,
//     bounce_rate_pct: `${Math.round(day.bounce_rate * 10) / 10}%`,
//     avg_session_duration_formatted: formatTime(day.avg_session_duration || 0)
//   }));
// }

// /**
//  * Create no tracking response
//  */
// export function createNoTrackingResponse(
//   params: any,
//   timezoneInfo: any,
//   startDate: string,
//   endDate: string
// ) {
//   return {
//     success: true,
//     tracking_setup: false,
//     website_id: params.website_id,
//     message: "No tracking data found. Please install the tracking script to start collecting analytics.",
//     date_range: { start_date: startDate, end_date: endDate, granularity: params.granularity },
//     timezone: {
//       timezone: timezoneInfo.timezone,
//       detected: timezoneInfo.detected,
//       source: timezoneInfo.source,
//       applied: timezoneInfo.timezone !== 'UTC'
//     }
//   };
// }
