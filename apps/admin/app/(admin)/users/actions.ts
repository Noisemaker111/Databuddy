"use server";

// Assuming your @databuddy/db package exports the Drizzle instance as `db`
// and your users schema as `user` (singular, based on previous linter hint).
import { db } from "@databuddy/db";
import { eq, or, like, desc } from "drizzle-orm";
import { user, websites, projects, chQuery } from "@databuddy/db";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

/**
 * Server Action to fetch all users for the admin dashboard.
 * IMPORTANT: This action must be secured to ensure only admins can call it.
 */
export async function getAllUsersAsAdmin() {
	try {
		const users = await db.select().from(user).orderBy(desc(user.createdAt));
		return { users, error: null };
	} catch (err) {
		console.error("Error fetching users for admin:", err);
		if (err instanceof Error) {
			return { users: [], error: err.message };
		}
		return {
			users: [],
			error: "An unknown error occurred while fetching users.",
		};
	}
}

export async function getUserBySlug(slug: string) {
	try {
		const userResult = await db
			.select()
			.from(user)
			.where(eq(user.id, slug))
			.limit(1);

		if (!userResult.length) {
			return { error: "User not found" };
		}

		const userData = userResult[0];

		const [websitesResult, projectsResult] = await Promise.all([
			db
				.select({
					id: websites.id,
					name: websites.name,
					domain: websites.domain,
					status: websites.status,
					createdAt: websites.createdAt,
				})
				.from(websites)
				.where(eq(websites.userId, userData.id)),
			db
				.select({
					id: projects.id,
					name: projects.name,
					slug: projects.slug,
					type: projects.type,
					status: projects.status,
					createdAt: projects.createdAt,
				})
				.from(projects)
				.where(eq(projects.organizationId, userData.id)),
		]);

		const userWithRelations = {
			...userData,
			websites: websitesResult.map((website) => ({
				...website,
			})),
			projects: projectsResult.map((project) => ({
				...project,
			})),
		};

		return { user: userWithRelations };
	} catch (error) {
		console.error("Error fetching user:", error);
		return { error: "Failed to fetch user" };
	}
}

// User Management Actions
export async function updateUserStatus(
	userId: string,
	status: "ACTIVE" | "SUSPENDED" | "INACTIVE",
) {
	try {
		await db.update(user).set({ status }).where(eq(user.id, userId));
		revalidatePath("/users/[slug]", "page");
		return { success: true };
	} catch (error) {
		console.error("Error updating user status:", error);
		return { error: "Failed to update user status" };
	}
}

export async function updateUserRole(
	userId: string,
	role:
		| "ADMIN"
		| "USER"
		| "EARLY_ADOPTER"
		| "INVESTOR"
		| "BETA_TESTER"
		| "GUEST",
) {
	try {
		await db.update(user).set({ role }).where(eq(user.id, userId));
		revalidatePath("/users/[slug]", "page");
		return { success: true };
	} catch (error) {
		console.error("Error updating user role:", error);
		return { error: "Failed to update user role" };
	}
}

export async function forceVerifyUser(userId: string) {
	try {
		await db
			.update(user)
			.set({ emailVerified: true })
			.where(eq(user.id, userId));
		revalidatePath("/users");
		return { success: true };
	} catch (error) {
		console.error("Error force verifying user:", error);
		return { error: "Failed to force verify user" };
	}
}

export async function transferWebsite(websiteId: string, newUserId: string) {
	try {
		// Verify website exists
		const website = await db
			.select()
			.from(websites)
			.where(eq(websites.id, websiteId))
			.limit(1);
		if (!website.length) {
			return { error: "Website not found" };
		}

		// Verify new user exists
		const newUser = await db
			.select()
			.from(user)
			.where(eq(user.id, newUserId))
			.limit(1);
		if (!newUser.length) {
			return { error: "Target user not found" };
		}

		// Transfer the website
		await db
			.update(websites)
			.set({
				userId: newUserId,
				updatedAt: new Date().toISOString(),
			})
			.where(eq(websites.id, websiteId));

		revalidatePath("/users/[slug]", "page");
		return {
			success: true,
			message: `Website "${website[0].name || website[0].domain}" transferred to ${newUser[0].name || newUser[0].email}`,
		};
	} catch (error) {
		console.error("Error transferring website:", error);
		return { error: "Failed to transfer website" };
	}
}

export async function searchUsers(query: string) {
	try {
		let users: {
			id: string;
			name: string | null;
			email: string;
			role: string;
		}[];

		if (!query || query.length < 2) {
			// Return all users when no query or query too short
			users = await db
				.select({
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
				})
				.from(user)
				.orderBy(desc(user.createdAt))
				.limit(50); // Show more users when displaying all
		} else {
			// Search specific users
			const searchQuery = `%${query.toLowerCase()}%`;

			users = await db
				.select({
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
				})
				.from(user)
				.where(or(like(user.email, searchQuery), like(user.name, searchQuery)))
				.limit(10);
		}

		return { users };
	} catch (error) {
		console.error("Error searching users:", error);
		return { error: "Failed to search users" };
	}
}

// Website Management Actions
export async function addWebsite(
	userId: string,
	websiteData: {
		name: string | null;
		domain: string;
		status?: "ACTIVE" | "HEALTHY" | "UNHEALTHY" | "INACTIVE" | "PENDING";
	},
) {
	try {
		// Check if website with this domain already exists
		const existingWebsite = await db
			.select()
			.from(websites)
			.where(eq(websites.domain, websiteData.domain))
			.limit(1);
		if (existingWebsite.length) {
			return {
				error: `A website with domain "${websiteData.domain}" already exists`,
			};
		}

		const websiteId = nanoid();
		await db.insert(websites).values({
			id: websiteId,
			name: websiteData.name,
			domain: websiteData.domain,
			userId,
			status: websiteData.status || "PENDING",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		revalidatePath("/users/[slug]", "page");
		return { success: true, websiteId };
	} catch (error) {
		console.error("Error adding website:", error);
		return { error: "Failed to add website" };
	}
}

export async function removeWebsite(websiteId: string) {
	try {
		await db.delete(websites).where(eq(websites.id, websiteId));
		revalidatePath("/users/[slug]", "page");
		return { success: true };
	} catch (error) {
		console.error("Error removing website:", error);
		return { error: "Failed to remove website" };
	}
}

export async function updateWebsiteStatus(
	websiteId: string,
	status: "ACTIVE" | "HEALTHY" | "UNHEALTHY" | "INACTIVE" | "PENDING",
) {
	try {
		await db
			.update(websites)
			.set({
				status,
				updatedAt: new Date().toISOString(),
			})
			.where(eq(websites.id, websiteId));
		revalidatePath("/users/[slug]", "page");
		return { success: true };
	} catch (error) {
		console.error("Error updating website status:", error);
		return { error: "Failed to update website status" };
	}
}

export async function deleteWebsite(websiteId: string) {
	try {
		await db.delete(websites).where(eq(websites.id, websiteId));
		revalidatePath("/users/[slug]", "page");
		return { success: true };
	} catch (error) {
		console.error("Error deleting website:", error);
		return { error: "Failed to delete website" };
	}
}

// Project Management Actions
export async function addProject(
	userId: string,
	projectData: {
		name: string;
		type: "website" | "mobile_app" | "desktop_app" | "api";
	},
) {
	try {
		const projectId = nanoid();
		const now = new Date().toISOString();

		await db.insert(projects).values({
			id: projectId,
			name: projectData.name,
			slug: projectData.name.toLowerCase().replace(/\s+/g, "-"),
			type: projectData.type,
			status: "active",
			organizationId: userId,
			createdAt: now,
			updatedAt: now,
		});

		revalidatePath("/users/[slug]", "page");
		return { success: true };
	} catch (error) {
		console.error("Error adding project:", error);
		return { error: "Failed to add project" };
	}
}

export async function removeProject(projectId: string) {
	try {
		await db.delete(projects).where(eq(projects.id, projectId));
		revalidatePath("/users/[slug]", "page");
		return { success: true };
	} catch (error) {
		console.error("Error removing project:", error);
		return { error: "Failed to remove project" };
	}
}

export async function updateProjectStatus(
	projectId: string,
	status: "active" | "completed" | "on_hold" | "cancelled",
) {
	try {
		await db
			.update(projects)
			.set({
				status,
				updatedAt: new Date().toISOString(),
			})
			.where(eq(projects.id, projectId));
		revalidatePath("/users/[slug]", "page");
		return { success: true };
	} catch (error) {
		console.error("Error updating project status:", error);
		return { error: "Failed to update project status" };
	}
}

export async function getUserAnalytics(userId: string) {
	try {
		// 1. Get website IDs from Drizzle/Postgres
		const websiteRows = await db
			.select({ id: websites.id, name: websites.name })
			.from(websites)
			.where(eq(websites.userId, userId));
		const websiteIds = websiteRows.map((w) => w.id);
		if (websiteIds.length === 0) {
			return {
				totalStats: {
					total_events: 0,
					total_websites: 0,
					total_sessions: 0,
					total_visitors: 0,
					avg_session_duration: 0,
					bounce_rate: 0,
				},
				eventsPerWebsite: [],
				eventsPerDay: [],
				topEventTypes: [],
				deviceStats: [],
				locationStats: [],
			};
		}
		const idsList = websiteIds.map((id) => `'${id}'`).join(",");

		// 2. Use analytics.events for summary stats
		const totalStats = await chQuery<{
			total_events: number;
			total_websites: number;
			total_sessions: number;
			total_visitors: number;
			avg_session_duration: number;
			bounce_rate: number;
		}>(`
      SELECT 
        count() as total_events,
        ${websiteIds.length} as total_websites,
        count(DISTINCT session_id) as total_sessions,
        count(DISTINCT anonymous_id) as total_visitors,
        avg(time_on_page) as avg_session_duration,
        0 as bounce_rate
      FROM analytics.events
      WHERE client_id IN (${idsList})
    `);

		// Get events per website with detailed stats
		const eventsPerWebsite = await chQuery<{
			website_id: string;
			event_count: number;
			session_count: number;
			visitor_count: number;
			avg_time_on_page: number;
			first_event: string;
			last_event: string;
		}>(`
      SELECT 
        client_id as website_id,
        count() as event_count,
        count(DISTINCT session_id) as session_count,
        count(DISTINCT anonymous_id) as visitor_count,
        avg(time_on_page) as avg_time_on_page,
        min(time) as first_event,
        max(time) as last_event
      FROM analytics.events
      WHERE client_id IN (${idsList})
      GROUP BY website_id
      ORDER BY event_count DESC
    `);
		// Attach website names from websiteRows
		const eventsPerWebsiteWithNames = eventsPerWebsite.map((e) => ({
			...e,
			website_name: websiteRows.find((w) => w.id === e.website_id)?.name || "",
		}));

		// Get events per day for the last 30 days with detailed metrics
		const eventsPerDay = await chQuery<{
			date: string;
			event_count: number;
			session_count: number;
			visitor_count: number;
			avg_time_on_page: number;
		}>(`
      SELECT 
        toDate(time) as date,
        count() as event_count,
        count(DISTINCT session_id) as session_count,
        count(DISTINCT anonymous_id) as visitor_count,
        avg(time_on_page) as avg_time_on_page
      FROM analytics.events
      WHERE client_id IN (${idsList})
        AND time >= now() - INTERVAL 30 DAY
      GROUP BY date
      ORDER BY date ASC
    `);

		// Get top event types with detailed stats
		const topEventTypes = await chQuery<{
			event_name: string;
			count: number;
			unique_users: number;
			avg_time_on_page: number;
		}>(`
      SELECT 
        event_name,
        count() as count,
        count(DISTINCT anonymous_id) as unique_users,
        avg(time_on_page) as avg_time_on_page
      FROM analytics.events
      WHERE client_id IN (${idsList})
      GROUP BY event_name
      ORDER BY count DESC
      LIMIT 10
    `);

		// Get device and browser stats
		const deviceStats = await chQuery<{
			device_type: string;
			browser_name: string;
			count: number;
			percentage: number;
		}>(`
      SELECT 
        device_type,
        browser_name,
        count() as count,
        count() * 100.0 / sum(count()) OVER () as percentage
      FROM analytics.events
      WHERE client_id IN (${idsList})
      GROUP BY device_type, browser_name
      ORDER BY count DESC
      LIMIT 5
    `);

		// Get location stats
		const locationStats = await chQuery<{
			country: string;
			region: string;
			count: number;
			percentage: number;
		}>(`
      SELECT 
        country,
        region,
        count() as count,
        count() * 100.0 / sum(count()) OVER () as percentage
      FROM analytics.events
      WHERE client_id IN (${idsList})
      GROUP BY country, region
      ORDER BY count DESC
      LIMIT 5
    `);

		return {
			totalStats: totalStats[0] || {
				total_events: 0,
				total_websites: websiteIds.length,
				total_sessions: 0,
				total_visitors: 0,
				avg_session_duration: 0,
				bounce_rate: 0,
			},
			eventsPerWebsite: eventsPerWebsiteWithNames,
			eventsPerDay,
			topEventTypes,
			deviceStats,
			locationStats,
		};
	} catch (error) {
		console.error("Error fetching user analytics:", error);
		return { error: "Failed to fetch analytics data" };
	}
}
