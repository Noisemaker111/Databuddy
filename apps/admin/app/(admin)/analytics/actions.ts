"use server";

import { db } from "@databuddy/db";
import {
	user as usersTable,
	websites as websitesTable,
	chQuery,
} from "@databuddy/db";
import { count, sql, inArray, desc } from "drizzle-orm";

export async function getAnalyticsOverviewData() {
	try {
		// Current period counts
		const [usersResult, websitesResult] = await Promise.all([
			db.select({ value: count() }).from(usersTable),
			db.select({ value: count() }).from(websitesTable),
		]);

		// Today's metrics using standard SQL
		const today = new Date().toISOString().split("T")[0]; // Get YYYY-MM-DD format
		const [usersTodayResult, websitesTodayResult] = await Promise.all([
			db
				.select({ value: count() })
				.from(usersTable)
				.where(sql`DATE(${usersTable.createdAt}) = ${today}`),
			db
				.select({ value: count() })
				.from(websitesTable)
				.where(sql`DATE(${websitesTable.createdAt}) = ${today}`),
		]);

		// Recent users (last 10)
		const recentUsers = await db
			.select({
				id: usersTable.id,
				name: usersTable.name,
				email: usersTable.email,
				image: usersTable.image,
				createdAt: usersTable.createdAt,
			})
			.from(usersTable)
			.orderBy(desc(usersTable.createdAt))
			.limit(10);

		// Recent websites (last 10)
		const recentWebsites = await db
			.select({
				id: websitesTable.id,
				name: websitesTable.name,
				domain: websitesTable.domain,
				status: websitesTable.status,
				createdAt: websitesTable.createdAt,
				userId: websitesTable.userId,
			})
			.from(websitesTable)
			.orderBy(desc(websitesTable.createdAt))
			.limit(10);

		// Get user info for recent websites - filter out null values
		const websiteUserIds = recentWebsites
			.map((w) => w.userId)
			.filter((id): id is string => id !== null);
		let websiteUsers: {
			id: string;
			name: string | null;
			email: string | null;
		}[] = [];
		if (websiteUserIds.length > 0) {
			websiteUsers = await db
				.select({
					id: usersTable.id,
					name: usersTable.name,
					email: usersTable.email,
				})
				.from(usersTable)
				.where(inArray(usersTable.id, websiteUserIds));
		}

		// Enhanced recent websites with user info
		const recentWebsitesWithUsers = recentWebsites.map((website) => {
			const user = websiteUsers.find((u) => u.id === website.userId);
			return {
				...website,
				user: user || null,
			};
		});

		const totalUsers = usersResult[0]?.value || 0;
		const totalWebsites = websitesResult[0]?.value || 0;
		const usersToday = usersTodayResult[0]?.value || 0;
		const websitesToday = websitesTodayResult[0]?.value || 0;

		// Historical data for charts
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		const now = new Date();

		const [usersPerDay, websitesPerDay] = await Promise.all([
			db
				.select({
					date: sql<string>`DATE_TRUNC('day', ${usersTable.createdAt})`,
					count: count(usersTable.id),
				})
				.from(usersTable)
				.where(sql`${usersTable.createdAt} >= ${thirtyDaysAgo} AND ${usersTable.createdAt} <= ${now}`)
				.groupBy(sql`1`)
				.orderBy(sql`1 ASC`),
			db
				.select({
					date: sql<string>`DATE_TRUNC('day', ${websitesTable.createdAt})`,
					count: count(websitesTable.id),
				})
				.from(websitesTable)
				.where(sql`${websitesTable.createdAt} >= ${thirtyDaysAgo} AND ${websitesTable.createdAt} <= ${now}`)
				.groupBy(sql`1`)
				.orderBy(sql`1 ASC`),
		]);

		// Cumulative data processing
		const processCumulativeData = (
			dailyData: { date: string; count: number }[],
			initialTotal: number,
		) => {
			const cumulativeMap: { [key: string]: number } = {};
			let runningTotal =
				initialTotal - dailyData.reduce((acc, curr) => acc + curr.count, 0);

			for (const item of dailyData) {
				runningTotal += item.count;
				const dateString = new Date(item.date).toISOString().split("T")[0];
				cumulativeMap[dateString] = runningTotal;
			}

			// Fill in missing dates
			const result: { date: string; value: number }[] = [];
			const date = new Date(thirtyDaysAgo);
			const today = new Date();
			let lastValue =
				initialTotal - dailyData.reduce((acc, curr) => acc + curr.count, 0);

			while (date <= today) {
				const dateString = date.toISOString().split("T")[0];
				if (cumulativeMap[dateString]) {
					lastValue = cumulativeMap[dateString];
				}
				result.push({ date: dateString, value: lastValue });
				date.setDate(date.getDate() + 1);
			}

			return result.filter(item => new Date(item.date) <= now);
		};

		const usersCumulative = processCumulativeData(usersPerDay, totalUsers);
		const websitesCumulative = processCumulativeData(
			websitesPerDay,
			totalWebsites,
		);

		// Initialize analytics variables
		let events24h = 0;
		let eventsMonthly = 0;
		let eventsOverTime: { date: string; value: number }[] = [];
		let events24hOverTime: { hour: string; value: number }[] = [];
		let recentActivity: { event_name: string; count: number }[] = [];
		let topCountries: { country: string; visitors: number }[] = [];
		let topWebsites: {
			website: string;
			value: number;
			name: string | null;
			domain: string | null;
		}[] = [];

		try {
			// Run all analytics queries concurrently
			const [
				events24hResult,
				eventsMonthlyResult,
				eventsOverTimeResult,
				events24hOverTimeResult,
				recentActivityResult,
				topCountriesResult,
				topWebsitesRaw,
			] = await Promise.all([
				// Events in last 24 hours
				chQuery<{ count: number }>(`
          SELECT count() as count
          FROM analytics.events
          WHERE time >= now() - INTERVAL 24 HOUR AND time <= now()
        `),

				// Events in last 30 days
				chQuery<{ count: number }>(`
          SELECT count() as count
          FROM analytics.events
          WHERE time >= now() - INTERVAL 30 DAY AND time <= now()
        `),

				// Events over time (30 days)
				chQuery<{ date: string; value: number }>(`
          SELECT
            toDate(time) as date,
            count() as value
          FROM analytics.events
          WHERE time >= now() - INTERVAL 30 DAY AND time <= now()
          GROUP BY date
          ORDER BY date ASC
        `),

				// Events over time (24 hours, hourly)
				chQuery<{ hour: string; value: number }>(`
          SELECT
            formatDateTime(time, '%Y-%m-%d %H:00:00') as hour,
            count() as value
          FROM analytics.events
          WHERE time >= now() - INTERVAL 24 HOUR AND time <= now()
          GROUP BY hour
          ORDER BY hour ASC
        `),

				// Recent activity (last 24 hours)
				chQuery<{ event_name: string; count: number }>(`
          SELECT
            event_name,
            count() as count
          FROM analytics.events
          WHERE time >= now() - INTERVAL 24 HOUR AND time <= now()
          GROUP BY event_name
          ORDER BY count DESC
          LIMIT 5
        `),

				// Top countries (last 7 days)
				chQuery<{ country: string; visitors: number }>(`
          SELECT
            country,
            count(DISTINCT anonymous_id) as visitors
          FROM analytics.events
          WHERE time >= now() - INTERVAL 7 DAY AND time <= now()
          AND country IS NOT NULL
          GROUP BY country
          ORDER BY visitors DESC
          LIMIT 5
        `),

				// Top websites (last 30 days)
				chQuery<{ website: string; value: number }>(`
          SELECT
            client_id as website,
            count() as value
          FROM analytics.events
          WHERE time >= now() - INTERVAL 30 DAY AND time <= now()
          GROUP BY website
          ORDER BY value DESC
          LIMIT 5
        `),
			]);

			// Assign results
			events24h = events24hResult[0]?.count || 0;
			eventsMonthly = eventsMonthlyResult[0]?.count || 0;
			eventsOverTime = eventsOverTimeResult || [];
			events24hOverTime = events24hOverTimeResult || [];
			recentActivity = recentActivityResult || [];

			// Debug: Log the actual data to see what we're getting
			topCountries = topCountriesResult || [];

			// Process top websites with additional info
			const websiteIds = topWebsitesRaw.map((w) => w.website);
			let websiteInfo: {
				id: string;
				name: string | null;
				domain: string | null;
			}[] = [];

			if (websiteIds.length > 0) {
				websiteInfo = await db
					.select({
						id: websitesTable.id,
						name: websitesTable.name,
						domain: websitesTable.domain,
					})
					.from(websitesTable)
					.where(inArray(websitesTable.id, websiteIds));
			}

			topWebsites = topWebsitesRaw.map((w) => {
				const info = websiteInfo.find((i) => i.id === w.website);
				return {
					website: w.website,
					value: w.value,
					name: info?.name || null,
					domain: info?.domain || null,
				};
			});
		} catch (analyticsError) {
			console.warn("Analytics events data not available:", analyticsError);
		}

		return {
			data: {
				totalUsers,
				totalWebsites,
				usersToday,
				websitesToday,
				events24h,
				eventsMonthly,
				recentUsers,
				recentWebsites: recentWebsitesWithUsers,
				recentActivity,
				topCountries,
				eventsOverTime,
				events24hOverTime,
				topWebsites,
				usersPerDay,
				websitesPerDay,
				usersCumulative,
				websitesCumulative,
				recentWebsitesWithUsers,
			},
			error: null,
		};
	} catch (error) {
		console.error("Failed to get analytics overview data:", error);
		if (error instanceof Error) {
			return { data: null, error: error.message };
		}
		return {
			data: null,
			error: "An unknown error occurred while fetching analytics data.",
		};
	}
}
