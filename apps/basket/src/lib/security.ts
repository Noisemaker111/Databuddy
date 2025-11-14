import crypto, { createHash } from "node:crypto";
import { redis } from "@databuddy/redis";
import { logger } from "./logger";
/**
 * Get or generate a daily salt for anonymizing user IDs
 * The salt rotates daily to maintain privacy while allowing same-day tracking
 */
export async function getDailySalt(): Promise<string> {
	const saltKey = `salt:${Math.floor(Date.now() / (24 * 60 * 60 * 1000))}`;
	try {
		let salt = await redis.get(saltKey);
		if (!salt) {
			salt = crypto.randomBytes(32).toString("hex");
			await redis.setex(saltKey, 60 * 60 * 24, salt);
		}
		return salt;
	} catch (error) {
		logger.error({ error }, "Failed to get or set daily salt from Redis");
		// Fallback: generate a new salt if Redis fails
		// This ensures the function doesn't break, but salt won't be shared across instances
		return crypto.randomBytes(32).toString("hex");
	}
}

/**
 * Salt and hash an anonymous ID for privacy
 */
export function saltAnonymousId(anonymousId: string, salt: string): string {
	try {
		return createHash("sha256")
			.update(anonymousId + salt)
			.digest("hex");
	} catch (error) {
		logger.error({ error, anonymousId }, "Failed to salt anonymous ID");
		// Fallback: return a hash of just the anonymousId if salting fails
		return createHash("sha256").update(anonymousId).digest("hex");
	}
}

/**
 * Check if an event has already been processed (deduplication)
 * Returns true if duplicate, false if new
 */
export async function checkDuplicate(
	eventId: string,
	eventType: string
): Promise<boolean> {
	const key = `dedup:${eventType}:${eventId}`;
	try {
		if (await redis.exists(key)) {
			return true;
		}

		const ttl = eventId.startsWith("exit_") ? 172_800 : 86_400;
		await redis.setex(key, ttl, "1");
		return false;
	} catch (error) {
		logger.error({ error, eventId, eventType }, "Failed to check duplicate event in Redis");
		// Return false (not duplicate) to avoid blocking events if Redis fails
		// This allows events to proceed, but deduplication won't work
		return false;
	}
}
