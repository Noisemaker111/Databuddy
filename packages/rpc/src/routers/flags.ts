import { websitesApi } from '@databuddy/auth';
import { flags } from '@databuddy/db';
import { createDrizzleCache, redis } from '@databuddy/redis';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { authorizeWebsiteAccess } from '../utils/auth';

const flagsCache = createDrizzleCache({ redis, namespace: 'flags' });
const CACHE_DURATION = 60; // seconds

// ============================================================================
// Schemas
// ============================================================================

const userRuleSchema = z.object({
	type: z.enum(['user_id', 'email', 'property', 'percentage']),
	operator: z.enum([
		'equals',
		'contains',
		'starts_with',
		'ends_with',
		'in',
		'not_in',
		'exists',
		'not_exists',
	]),
	field: z.string().optional(), // For property rules
	value: z.any().optional(),
	values: z.array(z.any()).optional(), // For 'in' and 'not_in' operators
	enabled: z.boolean(),
	// Batch support
	batch: z.boolean().default(false), // Whether this rule uses batch mode
	batchValues: z.array(z.string()).optional(), // For batch user IDs, emails, etc.
});

const flagSchema = z.object({
	key: z
		.string()
		.min(1)
		.max(100)
		.regex(
			/^[a-zA-Z0-9_-]+$/,
			'Key must contain only letters, numbers, underscores, and hyphens'
		),
	name: z.string().min(1).max(100).optional(),
	description: z.string().optional(),
	type: z.enum(['boolean', 'multivariate', 'rollout']).default('boolean'),
	status: z.enum(['active', 'inactive', 'archived']).default('active'),
	defaultValue: z.any().default(false),
	payload: z.any().optional(),
	rules: z.array(userRuleSchema).default([]),
	persistAcrossAuth: z.boolean().default(false),
	rolloutPercentage: z.number().min(0).max(100).default(0),
});

const createFlagSchema = z
	.object({
		websiteId: z.string().optional(),
		organizationId: z.string().optional(),
		...flagSchema.shape,
	})
	.refine((data) => data.websiteId || data.organizationId, {
		message: 'Either websiteId or organizationId must be provided',
		path: ['websiteId'],
	});

const updateFlagSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(100).optional(),
	description: z.string().optional(),
	type: z.enum(['boolean', 'multivariate', 'rollout']).optional(),
	status: z.enum(['active', 'inactive', 'archived']).optional(),
	defaultValue: z.any().optional(),
	payload: z.any().optional(),
	rules: z.array(userRuleSchema).optional(),
	persistAcrossAuth: z.boolean().optional(),
	rolloutPercentage: z.number().min(0).max(100).optional(),
});

const listFlagsSchema = z
	.object({
		websiteId: z.string().optional(),
		organizationId: z.string().optional(),
		status: z.enum(['active', 'inactive', 'archived']).optional(),
	})
	.refine((data) => data.websiteId || data.organizationId, {
		message: 'Either websiteId or organizationId must be provided',
		path: ['websiteId'],
	});

const getFlagSchema = z
	.object({
		id: z.string(),
		websiteId: z.string().optional(),
		organizationId: z.string().optional(),
	})
	.refine((data) => data.websiteId || data.organizationId, {
		message: 'Either websiteId or organizationId must be provided',
		path: ['websiteId'],
	});

const evaluateFlagSchema = z
	.object({
		key: z.string(),
		websiteId: z.string().optional(),
		organizationId: z.string().optional(),
		userId: z.string().optional(),
		email: z.string().optional(),
		properties: z.record(z.string(), z.any()).optional(),
		context: z.record(z.string(), z.any()).optional(),
	})
	.refine((data) => data.websiteId || data.organizationId, {
		message: 'Either websiteId or organizationId must be provided',
		path: ['websiteId'],
	});

export const flagsRouter = createTRPCRouter({
	list: publicProcedure.input(listFlagsSchema).query(({ ctx, input }) => {
		const scope = input.websiteId
			? `website:${input.websiteId}`
			: `org:${input.organizationId}`;
		const cacheKey = `list:${scope}:${input.status || 'all'}`;

		return flagsCache.withCache({
			key: cacheKey,
			ttl: CACHE_DURATION,
			tables: ['flags'],
			queryFn: async () => {
				if (input.websiteId) {
					await authorizeWebsiteAccess(ctx, input.websiteId, 'read');
				} else if (input.organizationId) {
					const { success } = await websitesApi.hasPermission({
						headers: ctx.headers,
						body: { permissions: { website: ['read'] } },
					});
					if (!success) {
						throw new TRPCError({
							code: 'FORBIDDEN',
							message: 'Missing organization permissions.',
						});
					}
				}

				const conditions = [
					isNull(flags.deletedAt),
					input.websiteId
						? eq(flags.websiteId, input.websiteId)
						: eq(flags.organizationId, input.organizationId ?? ''),
				];

				if (input.status) {
					conditions.push(eq(flags.status, input.status));
				}

				return ctx.db
					.select()
					.from(flags)
					.where(and(...conditions))
					.orderBy(desc(flags.createdAt));
			},
		});
	}),

	getById: publicProcedure.input(getFlagSchema).query(({ ctx, input }) => {
		const scope = input.websiteId
			? `website:${input.websiteId}`
			: `org:${input.organizationId}`;
		const cacheKey = `byId:${input.id}:${scope}`;

		return flagsCache.withCache({
			key: cacheKey,
			ttl: CACHE_DURATION,
			tables: ['flags'],
			queryFn: async () => {
				if (input.websiteId) {
					await authorizeWebsiteAccess(ctx, input.websiteId, 'read');
				}

				const result = await ctx.db
					.select()
					.from(flags)
					.where(
						and(
							eq(flags.id, input.id),
							input.websiteId
								? eq(flags.websiteId, input.websiteId)
								: eq(flags.organizationId, input.organizationId ?? ''),
							isNull(flags.deletedAt)
						)
					)
					.limit(1);

				if (result.length === 0) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Flag not found',
					});
				}

				return result[0];
			},
		});
	}),

	getByKey: publicProcedure
		.input(evaluateFlagSchema)
		.query(({ ctx, input }) => {
			const scope = input.websiteId
				? `website:${input.websiteId}`
				: `org:${input.organizationId}`;
			const cacheKey = `byKey:${input.key}:${scope}`;

			return flagsCache.withCache({
				key: cacheKey,
				ttl: CACHE_DURATION,
				tables: ['flags'],
				queryFn: async () => {
					if (input.websiteId) {
						await authorizeWebsiteAccess(ctx, input.websiteId, 'read');
					}

					const result = await ctx.db
						.select()
						.from(flags)
						.where(
							and(
								eq(flags.key, input.key),
								input.websiteId
									? eq(flags.websiteId, input.websiteId)
									: eq(flags.organizationId, input.organizationId ?? ''),
								eq(flags.status, 'active'),
								isNull(flags.deletedAt)
							)
						)
						.limit(1);

					if (result.length === 0) {
						throw new TRPCError({
							code: 'NOT_FOUND',
							message: 'Flag not found',
						});
					}

					return result[0];
				},
			});
		}),

	create: protectedProcedure
		.input(createFlagSchema)
		.mutation(async ({ ctx, input }) => {
			if (input.websiteId) {
				await authorizeWebsiteAccess(ctx, input.websiteId, 'update');
			} else if (input.organizationId) {
				const { success } = await websitesApi.hasPermission({
					headers: ctx.headers,
					body: { permissions: { website: ['create'] } },
				});
				if (!success) {
					throw new TRPCError({
						code: 'FORBIDDEN',
						message: 'Missing organization permissions.',
					});
				}
			}

			const flagId = crypto.randomUUID();

			try {
				const [newFlag] = await ctx.db
					.insert(flags)
					.values({
						id: flagId,
						key: input.key,
						name: input.name || null,
						description: input.description || null,
						type: input.type,
						status: input.status,
						defaultValue: input.defaultValue,
						payload: input.payload || null,
						rules: input.rules || [],
						persistAcrossAuth: input.persistAcrossAuth ?? false,
						rolloutPercentage: input.rolloutPercentage || 0,
						websiteId: input.websiteId || null,
						organizationId: input.organizationId || null,
						userId: input.websiteId ? null : ctx.user.id,
						createdBy: ctx.user.id,
					})
					.returning();

				await flagsCache.invalidateByTables(['flags']);

				logger.info('Flag created', {
					flagId: newFlag.id,
					key: input.key,
					websiteId: input.websiteId,
					organizationId: input.organizationId,
					userId: ctx.user.id,
				});

				return newFlag;
			} catch (error) {
				if (error instanceof Error && error.message.includes('unique')) {
					throw new TRPCError({
						code: 'CONFLICT',
						message: 'A flag with this key already exists in this scope',
					});
				}

				logger.error('Failed to create flag', {
					error: error instanceof Error ? error.message : 'Unknown error',
					key: input.key,
					websiteId: input.websiteId,
					organizationId: input.organizationId,
					userId: ctx.user.id,
				});

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to create flag',
				});
			}
		}),

	update: protectedProcedure
		.input(updateFlagSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const existingFlag = await ctx.db
					.select({
						websiteId: flags.websiteId,
						organizationId: flags.organizationId,
						userId: flags.userId,
					})
					.from(flags)
					.where(and(eq(flags.id, input.id), isNull(flags.deletedAt)))
					.limit(1);

				if (existingFlag.length === 0) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Flag not found',
					});
				}

				const flag = existingFlag[0];

				if (flag.websiteId) {
					await authorizeWebsiteAccess(ctx, flag.websiteId, 'update');
				} else if (
					flag.userId &&
					flag.userId !== ctx.user.id &&
					ctx.user.role !== 'ADMIN'
				) {
					throw new TRPCError({
						code: 'FORBIDDEN',
						message: 'Not authorized to update this flag',
					});
				}

				const { id, ...updates } = input;
				const [updatedFlag] = await ctx.db
					.update(flags)
					.set({
						...updates,
						updatedAt: new Date(),
					})
					.where(and(eq(flags.id, id), isNull(flags.deletedAt)))
					.returning();

				// Invalidate caches
				const scope = flag.websiteId
					? `website:${flag.websiteId}`
					: `org:${flag.organizationId}`;
				await Promise.all([
					flagsCache.invalidateByTables(['flags']),
					flagsCache.invalidateByKey(`byId:${id}:${scope}`),
				]);

				logger.info('Flag updated', {
					flagId: id,
					websiteId: flag.websiteId,
					organizationId: flag.organizationId,
					userId: ctx.user.id,
				});

				return updatedFlag;
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}

				logger.error('Failed to update flag', {
					error: error instanceof Error ? error.message : 'Unknown error',
					flagId: input.id,
					userId: ctx.user.id,
				});

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to update flag',
				});
			}
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			try {
				const existingFlag = await ctx.db
					.select({
						websiteId: flags.websiteId,
						organizationId: flags.organizationId,
						userId: flags.userId,
					})
					.from(flags)
					.where(and(eq(flags.id, input.id), isNull(flags.deletedAt)))
					.limit(1);

				if (existingFlag.length === 0) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Flag not found',
					});
				}

				const flag = existingFlag[0];

				// Authorize access based on scope
				if (flag.websiteId) {
					await authorizeWebsiteAccess(ctx, flag.websiteId, 'delete');
				} else if (
					flag.userId &&
					flag.userId !== ctx.user.id &&
					ctx.user.role !== 'ADMIN'
				) {
					throw new TRPCError({
						code: 'FORBIDDEN',
						message: 'Not authorized to delete this flag',
					});
				}

				// Soft delete
				await ctx.db
					.update(flags)
					.set({
						deletedAt: new Date(),
						status: 'archived',
					})
					.where(and(eq(flags.id, input.id), isNull(flags.deletedAt)));

				// Invalidate caches
				const scope = flag.websiteId
					? `website:${flag.websiteId}`
					: `org:${flag.organizationId}`;
				await Promise.all([
					flagsCache.invalidateByTables(['flags']),
					flagsCache.invalidateByKey(`byId:${input.id}:${scope}`),
				]);

				logger.info('Flag deleted', {
					flagId: input.id,
					websiteId: flag.websiteId,
					organizationId: flag.organizationId,
					userId: ctx.user.id,
				});

				return { success: true };
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}

				logger.error('Failed to delete flag', {
					error: error instanceof Error ? error.message : 'Unknown error',
					flagId: input.id,
					userId: ctx.user.id,
				});

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to delete flag',
				});
			}
		}),

	evaluate: publicProcedure
		.input(evaluateFlagSchema)
		.query(async ({ ctx, input }) => {
			try {
				if (input.websiteId) {
					await authorizeWebsiteAccess(ctx, input.websiteId, 'read');
				}

				// Get the flag
				const result = await ctx.db
					.select()
					.from(flags)
					.where(
						and(
							eq(flags.key, input.key),
							input.websiteId
								? eq(flags.websiteId, input.websiteId)
								: eq(flags.organizationId, input.organizationId ?? ''),
							eq(flags.status, 'active'),
							isNull(flags.deletedAt)
						)
					)
					.limit(1);

				if (result.length === 0) {
					return {
						enabled: false,
						value: false,
						payload: null,
						reason: 'FLAG_NOT_FOUND',
					};
				}

				const flag = result[0];

				// Simple evaluation logic - can be enhanced later
				let enabled = false;
				let value = flag.defaultValue;
				const payload = flag.payload;
				let reason = 'DEFAULT_VALUE';

				// Check rollout percentage for rollout type flags
				if (flag.type === 'rollout' && flag.rolloutPercentage > 0) {
					// Simple hash-based rollout (can be improved with better distribution)
					const userId = input.userId || ctx.user?.id || 'anonymous';
					const hash = hashString(`${flag.key}:${userId}`);
					const percentage = hash % 100;

					if (percentage < flag.rolloutPercentage) {
						enabled = true;
						value = true;
						reason = 'ROLLOUT_MATCH';
					} else {
						reason = 'ROLLOUT_NO_MATCH';
					}
				} else if (flag.type === 'boolean') {
					enabled = Boolean(flag.defaultValue);
					value = flag.defaultValue;
					reason = 'BOOLEAN_FLAG';
				}

				// Check user targeting rules
				if (flag.rules && Array.isArray(flag.rules) && flag.rules.length > 0) {
					const userContext = {
						userId: input.userId || ctx.user?.id,
						email: input.email,
						properties: input.properties || {},
					};

					const ruleResult = evaluateUserRules(
						flag.rules as UserRule[],
						userContext
					);
					if (ruleResult.matched) {
						enabled = ruleResult.enabled;
						value = ruleResult.enabled;
						reason = 'USER_RULE_MATCH';
					} else if (ruleResult.hasRules) {
						// User didn't match any rules, use default behavior
						enabled = Boolean(flag.defaultValue);
						value = flag.defaultValue;
						reason = 'USER_RULE_NO_MATCH';
					}
				}

				return {
					enabled,
					value,
					payload,
					reason,
					flagId: flag.id,
					flagType: flag.type,
				};
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}

				logger.error('Failed to evaluate flag', {
					error: error instanceof Error ? error.message : 'Unknown error',
					key: input.key,
					websiteId: input.websiteId,
					organizationId: input.organizationId,
					userId: input.userId,
				});

				// Return safe default on error
				return {
					enabled: false,
					value: false,
					payload: null,
					reason: 'EVALUATION_ERROR',
				};
			}
		}),
});

// ============================================================================
// Utility Functions
// ============================================================================

// Simple hash function for rollout distribution
function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash &= hash; // Convert to 32-bit integer
	}
	return Math.abs(hash);
}

// User targeting rule evaluation
interface UserContext {
	userId?: string;
	email?: string;
	properties?: Record<string, any>;
}

interface UserRule {
	type: 'user_id' | 'email' | 'property' | 'percentage';
	operator:
		| 'equals'
		| 'contains'
		| 'starts_with'
		| 'ends_with'
		| 'in'
		| 'not_in'
		| 'exists'
		| 'not_exists';
	field?: string; // For property rules
	value?: any;
	values?: any[]; // For 'in' and 'not_in' operators
	enabled: boolean; // What to return if this rule matches
	// Batch support
	batch: boolean; // Whether this rule uses batch mode
	batchValues?: string[]; // For batch user IDs, emails, etc.
}

interface RuleEvaluationResult {
	matched: boolean;
	enabled: boolean;
	hasRules: boolean;
}

function evaluateUserRules(
	rules: UserRule[],
	userContext: UserContext
): RuleEvaluationResult {
	if (!rules || rules.length === 0) {
		return { matched: false, enabled: false, hasRules: false };
	}

	// Evaluate rules in order - first match wins
	for (const rule of rules) {
		if (evaluateRule(rule, userContext)) {
			return { matched: true, enabled: rule.enabled, hasRules: true };
		}
	}

	return { matched: false, enabled: false, hasRules: true };
}

function evaluateRule(rule: UserRule, userContext: UserContext): boolean {
	// Handle batch mode first
	if (rule.batch && rule.batchValues?.length) {
		switch (rule.type) {
			case 'user_id': {
				return userContext.userId
					? rule.batchValues.includes(userContext.userId)
					: false;
			}
			case 'email': {
				return userContext.email
					? rule.batchValues.includes(userContext.email)
					: false;
			}
			case 'property': {
				if (!rule.field) {
					return false;
				}
				const propertyValue = userContext.properties?.[rule.field];
				return propertyValue
					? rule.batchValues.includes(String(propertyValue))
					: false;
			}
			default: {
				return false;
			}
		}
	}

	// Regular single-value evaluation
	switch (rule.type) {
		case 'user_id': {
			return evaluateStringRule(userContext.userId, rule);
		}

		case 'email': {
			return evaluateStringRule(userContext.email, rule);
		}

		case 'property': {
			if (!rule.field) {
				return false;
			}
			const propertyValue = userContext.properties?.[rule.field];
			return evaluateValueRule(propertyValue, rule);
		}

		case 'percentage': {
			if (typeof rule.value !== 'number') {
				return false;
			}
			const userId = userContext.userId || userContext.email || 'anonymous';
			const hash = hashString(`percentage:${userId}`);
			const percentage = hash % 100;
			return percentage < rule.value;
		}

		default: {
			return false;
		}
	}
}

function evaluateStringRule(
	value: string | undefined,
	rule: UserRule
): boolean {
	if (!value) {
		return false;
	}

	const { operator, value: ruleValue, values } = rule;
	const stringValue = String(ruleValue);

	switch (operator) {
		case 'equals': {
			return value === ruleValue;
		}
		case 'contains': {
			return value.includes(stringValue);
		}
		case 'starts_with': {
			return value.startsWith(stringValue);
		}
		case 'ends_with': {
			return value.endsWith(stringValue);
		}
		case 'in': {
			return Array.isArray(values) && values.includes(value);
		}
		case 'not_in': {
			return Array.isArray(values) && !values.includes(value);
		}
		default: {
			return false;
		}
	}
}

function evaluateValueRule(value: any, rule: UserRule): boolean {
	const { operator, value: ruleValue, values } = rule;

	switch (operator) {
		case 'equals': {
			return value === ruleValue;
		}
		case 'contains': {
			return String(value).includes(String(ruleValue));
		}
		case 'in': {
			return Array.isArray(values) && values.includes(value);
		}
		case 'not_in': {
			return Array.isArray(values) && !values.includes(value);
		}
		case 'exists': {
			return value !== undefined && value !== null;
		}
		case 'not_exists': {
			return value === undefined || value === null;
		}
		default: {
			return false;
		}
	}
}
