// /**
//  * Complete Analytics Data Processor
//  *
//  * Single utility that processes all analytics data from raw query results to final response
//  */

// import {
// 	processEventsForTimezone,
// 	filterEventsForTimezone,
// 	processSummaryForTimezone,
// 	adjustTodayDataForTimezone,
// 	type AnalyticsEntry,
// } from "./analytics-timezone";
// import { parseReferrers } from "../builders/analytics";
// import {
// 	mergeTodayDataIntoSummary,
// 	updateEventsWithTodayData,
// } from "./today-data-processor";
// import { isInternalReferrer } from "./referrer";
// import {
// 	processPages,
// 	processDeviceInfo,
// 	processGeoInfo,
// 	processUTMData,
// 	processReferrers,
// 	processEntryPages,
// 	processExitPages,
// } from "./data-processors";
// import {
// 	formatPerformanceData,
// 	formatSummaryData,
// 	formatEventsByDate,
// } from "./response-formatter";

// export interface AnalyticsProcessorInput {
// 	queryResults: any[];
// 	website: any;
// 	timezoneInfo: any;
// 	startDate: string;
// 	endDate: string;
// 	adjustedStartDate: string;
// 	adjustedEndDate: string;
// 	granularity: "hourly" | "daily";
// 	params: any;
// }

// /**
//  * Process all analytics data in one shot
//  */
// export function processAnalyticsData(input: AnalyticsProcessorInput) {
// 	const {
// 		queryResults,
// 		website,
// 		timezoneInfo,
// 		startDate,
// 		endDate,
// 		granularity,
// 		params,
// 	} = input;

// 	const [
// 		summaryData,
// 		todayData,
// 		,
// 		pagesData,
// 		referrersData,
// 		eventsByDate,
// 		deviceInfoData,
// 		geoInfoData,
// 		performance,
// 		utmData,
// 		entryPagesData,
// 		exitPagesData,
// 	] = queryResults;

// 	// Process today's data
// 	const rawTodaySummary = todayData?.[0] || {
// 		pageviews: 0,
// 		unique_visitors: 0,
// 		sessions: 0,
// 		bounce_rate: 0,
// 		avg_session_duration: 0,
// 	};

// 	const todaySummary = adjustTodayDataForTimezone(
// 		{
// 			pageviews: rawTodaySummary.pageviews || 0,
// 			visitors: rawTodaySummary.unique_visitors || 0,
// 			sessions: rawTodaySummary.sessions || 0,
// 			bounce_rate: rawTodaySummary.bounce_rate || 0,
// 			bounce_rate_pct: `${Math.round((rawTodaySummary.bounce_rate || 0) * 10) / 10}%`,
// 		},
// 		timezoneInfo.timezone,
// 	);

// 	// Process summary and events
// 	const summary = mergeTodayDataIntoSummary(summaryData[0], todaySummary);
// 	const processedSummary = processSummaryForTimezone(
// 		summary,
// 		timezoneInfo.timezone,
// 		startDate,
// 		endDate,
// 	);

// 	const rawEventsByDate = updateEventsWithTodayData(
// 		eventsByDate as AnalyticsEntry[],
// 		todaySummary,
// 		granularity,
// 	);
// 	const timezoneAwareEvents = processEventsForTimezone(
// 		rawEventsByDate,
// 		timezoneInfo.timezone,
// 	);
// 	const filteredEvents = filterEventsForTimezone(
// 		timezoneAwareEvents,
// 		startDate,
// 		endDate,
// 		timezoneInfo.timezone,
// 	);

// 	// Process all data
// 	const topPages = processPages(pagesData).slice(0, 100);
// 	const topReferrers = processReferrers(
// 		referrersData,
// 		website,
// 		parseReferrers,
// 		isInternalReferrer,
// 	);
// 	const deviceInfo = processDeviceInfo(deviceInfoData);
// 	const geoInfo = processGeoInfo(geoInfoData);
// 	const utmInfo = processUTMData(utmData);
// 	const entryPages = processEntryPages(entryPagesData);
// 	const exitPages = processExitPages(exitPagesData);

// 	return {
// 		success: true,
// 		tracking_setup: true,
// 		website_id: params.website_id,
// 		date_range: {
// 			start_date: startDate,
// 			end_date: endDate,
// 			granularity: params.granularity,
// 		},
// 		timezone: {
// 			timezone: timezoneInfo.timezone,
// 			detected: timezoneInfo.detected,
// 			source: timezoneInfo.source,
// 			applied: timezoneInfo.timezone !== "UTC",
// 			adjusted_date_range: {
// 				start_date: input.adjustedStartDate,
// 				end_date: input.adjustedEndDate,
// 			},
// 		},
// 		summary: formatSummaryData(processedSummary),
// 		events_by_date: formatEventsByDate(filteredEvents),
// 		today: todaySummary,
// 		top_pages: topPages,
// 		top_referrers: topReferrers,
// 		screen_resolutions: deviceInfo.screen_resolutions,
// 		browser_versions: deviceInfo.browser_versions,
// 		countries: geoInfo.countries,
// 		device_types: deviceInfo.device_types,
// 		connection_types: deviceInfo.connection_types,
// 		languages: geoInfo.languages,
// 		timezones: geoInfo.timezones,
// 		utm_sources: utmInfo.utm_sources,
// 		utm_mediums: utmInfo.utm_mediums,
// 		utm_campaigns: utmInfo.utm_campaigns,
// 		entry_pages: entryPages,
// 		exit_pages: exitPages,
// 		performance: formatPerformanceData(performance),
// 	};
// }
