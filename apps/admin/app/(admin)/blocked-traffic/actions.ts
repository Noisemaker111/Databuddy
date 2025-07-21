"use server";

import { chQuery } from "@databuddy/db";
import { db, websites as websitesTable, inArray } from "@databuddy/db";

export async function getBlockedTrafficTrends({ from, to, client_id }: { from?: string; to?: string; client_id?: string } = {}) {
    const conditions = [];
    if (from) conditions.push(`timestamp >= parseDateTimeBestEffort('${from}')`);
    if (to) conditions.push(`timestamp <= parseDateTimeBestEffort('${to} 23:59:59')`);
    if (client_id) conditions.push(`client_id = '${client_id}'`);
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `
    SELECT toDate(timestamp) as date, COUNT(*) as blocked_count
    FROM analytics.blocked_traffic
    ${whereClause}
    GROUP BY date
    ORDER BY date ASC
  `;
    return chQuery<{ date: string; blocked_count: number }>(query);
}

export async function getBlockedTrafficTopWebsites({ from, to }: { from?: string; to?: string } = {}) {
    const conditions = [];
    if (from) conditions.push(`timestamp >= parseDateTimeBestEffort('${from}')`);
    if (to) conditions.push(`timestamp <= parseDateTimeBestEffort('${to} 23:59:59')`);
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `
    SELECT client_id as website_id, COUNT(*) as blocked_count
    FROM analytics.blocked_traffic
    ${whereClause}
    GROUP BY client_id
    ORDER BY blocked_count DESC
    LIMIT 10
  `;
    return chQuery<{ website_id: string; blocked_count: number }>(query);
}

export async function getBlockedTrafficTopReasons({ from, to, client_id }: { from?: string; to?: string; client_id?: string } = {}) {
    const conditions = [];
    if (from) conditions.push(`timestamp >= parseDateTimeBestEffort('${from}')`);
    if (to) conditions.push(`timestamp <= parseDateTimeBestEffort('${to} 23:59:59')`);
    if (client_id) conditions.push(`client_id = '${client_id}'`);
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `
    SELECT block_reason as reason, COUNT(*) as blocked_count
    FROM analytics.blocked_traffic
    ${whereClause}
    GROUP BY block_reason
    ORDER BY blocked_count DESC
    LIMIT 10
  `;
    return chQuery<{ reason: string; blocked_count: number }>(query);
}

export async function getBlockedTrafficTopCountries({ from, to, client_id }: { from?: string; to?: string; client_id?: string } = {}) {
    const conditions = [];
    if (from) conditions.push(`timestamp >= parseDateTimeBestEffort('${from}')`);
    if (to) conditions.push(`timestamp <= parseDateTimeBestEffort('${to} 23:59:59')`);
    if (client_id) conditions.push(`client_id = '${client_id}'`);
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `
    SELECT country, COUNT(*) as blocked_count
    FROM analytics.blocked_traffic
    ${whereClause}
    GROUP BY country
    ORDER BY blocked_count DESC
    LIMIT 10
  `;
    return chQuery<{ country: string; blocked_count: number }>(query);
}

export async function getBlockedTrafficDetails({ from, to, client_id, block_reason, limit = 100, offset = 0 }: { from?: string; to?: string; client_id?: string; block_reason?: string; limit?: number; offset?: number } = {}) {
    const conditions = [];
    if (from) conditions.push(`timestamp >= parseDateTimeBestEffort('${from}')`);
    if (to) conditions.push(`timestamp <= parseDateTimeBestEffort('${to} 23:59:59')`);
    if (client_id) conditions.push(`client_id = '${client_id}'`);
    if (block_reason) conditions.push(`block_reason = '${block_reason}'`);
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `
    SELECT id, client_id, timestamp, path, url, referrer, method, origin, ip, user_agent, accept_header, language, block_reason, block_category, bot_name, country, region, browser_name, browser_version, os_name, os_version, device_type, payload_size, created_at
    FROM analytics.blocked_traffic
    ${whereClause}
    ORDER BY timestamp DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
    const rows = await chQuery<any>(query);
    // Fetch domains from Postgres for all unique client_ids
    const clientIds = Array.from(new Set(rows.map(r => r.client_id).filter(Boolean)));
    let domainMap: Record<string, string | null> = {};
    if (clientIds.length > 0) {
        const domains = await db
            .select({ id: websitesTable.id, domain: websitesTable.domain })
            .from(websitesTable)
            .where(inArray(websitesTable.id, clientIds));
        domainMap = Object.fromEntries(domains.map(w => [w.id, w.domain]));
    }
    return rows.map(row => ({ ...row, domain: domainMap[row.client_id] || null }));
} 