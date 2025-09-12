import { websites } from '@databuddy/db';
import { logger } from '@databuddy/shared';
import { TRPCError } from '@trpc/server';
import { and, eq, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { invalidateWebsiteCaches } from '../utils/cache-invalidation';

const WEBSITE_NAME_REGEX = /^[a-zA-Z0-9\s\-_.]+$/;
const DOMAIN_REGEX =
	/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;

export const websiteNameSchema = z
	.string()
	.min(1)
	.max(100)
	.regex(WEBSITE_NAME_REGEX, 'Invalid website name format');

export const domainSchema = z.preprocess(
	(val) => {
		if (typeof val !== 'string') {
			return val;
		}
		let domain = val.trim();
		if (domain.startsWith('http://') || domain.startsWith('https://')) {
			try {
				domain = new URL(domain).hostname;
			} catch {
				// Do nothing
			}
		}
		return domain;
	},
	z.string().min(1).max(253).regex(DOMAIN_REGEX, 'Invalid domain format')
);

export const subdomainSchema = z
	.string()
	.max(63)
	.regex(/^[a-zA-Z0-9-]*$/, 'Invalid subdomain format')
	.optional();

// Helper functions
export const buildFullDomain = (rawDomain: string, rawSubdomain?: string) => {
	const domain = rawDomain.trim().toLowerCase();
	const subdomain = rawSubdomain?.trim().toLowerCase();
	return subdomain ? `${subdomain}.${domain}` : domain;
};

export const buildWebsiteFilter = (userId: string, organizationId?: string) =>
	organizationId
		? eq(websites.organizationId, organizationId)
		: and(eq(websites.userId, userId), isNull(websites.organizationId));

// Types
export interface CreateWebsiteInput {
	name: string;
	domain: string;
	subdomain?: string;
	userId: string;
	organizationId?: string;
}

export interface CreateWebsiteOptions {
	skipDuplicateCheck?: boolean;
	logContext?: Record<string, any>;
}

// Website service class
export class WebsiteService {
	private db: any;

	constructor(db: any) {
		this.db = db;
	}

	async createWebsite(
		input: CreateWebsiteInput,
		options: CreateWebsiteOptions = {}
	) {
		const { skipDuplicateCheck = false, logContext = {} } = options;
		const domainToCreate = buildFullDomain(input.domain, input.subdomain);

		const websiteFilter = and(
			eq(websites.domain, domainToCreate),
			buildWebsiteFilter(input.userId, input.organizationId)
		);

		const createdWebsite = await this.db.transaction(async (tx: any) => {
			if (!skipDuplicateCheck) {
				const duplicateWebsite = await tx.query.websites.findFirst({
					where: websiteFilter,
				});

				if (duplicateWebsite) {
					const scopeDescription = input.organizationId
						? 'in this organization'
						: 'for your account';
					throw new TRPCError({
						code: 'CONFLICT',
						message: `A website with the domain "${domainToCreate}" already exists ${scopeDescription}.`,
					});
				}
			}

			const [website] = await tx
				.insert(websites)
				.values({
					id: nanoid(),
					name: input.name,
					domain: domainToCreate,
					userId: input.userId,
					organizationId: input.organizationId,
					status: 'ACTIVE',
				})
				.returning();

			return website;
		});

		logger.success(
			'Website Created',
			`New website "${createdWebsite.name}" was created with domain "${createdWebsite.domain}"`,
			{
				websiteId: createdWebsite.id,
				domain: createdWebsite.domain,
				userId: input.userId,
				organizationId: createdWebsite.organizationId,
				...logContext,
			}
		);

		await invalidateWebsiteCaches(createdWebsite.id, input.userId);

		return createdWebsite;
	}

	async updateWebsite(
		websiteId: string,
		updates: { name?: string; domain?: string; integrations?: any },
		userId: string,
		organizationId?: string
	) {
		if (updates.domain) {
			const domainToUpdate = buildFullDomain(updates.domain);
			const websiteFilter = and(
				eq(websites.domain, domainToUpdate),
				buildWebsiteFilter(userId, organizationId)
			);

			const duplicateWebsite = await this.db.query.websites.findFirst({
				where: websiteFilter,
			});

			if (duplicateWebsite && duplicateWebsite.id !== websiteId) {
				const scopeDescription = organizationId
					? 'in this organization'
					: 'for your account';
				throw new TRPCError({
					code: 'CONFLICT',
					message: `A website with the domain "${domainToUpdate}" already exists ${scopeDescription}.`,
				});
			}
		}

		const updateData: { name?: string; domain?: string; integrations?: any } =
			{};
		if (updates.name) {
			updateData.name = updates.name;
		}
		if (updates.domain) {
			updateData.domain = buildFullDomain(updates.domain);
		}
		if (updates.integrations !== undefined) {
			updateData.integrations = updates.integrations;
		}

		const [updatedWebsite] = await this.db
			.update(websites)
			.set(updateData)
			.where(eq(websites.id, websiteId))
			.returning();

		if (!updatedWebsite) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Website not found',
			});
		}

		// Invalidate caches
		await invalidateWebsiteCaches(websiteId, userId);

		return updatedWebsite;
	}

	async deleteWebsite(websiteId: string, userId: string) {
		await this.db.transaction(async (tx: any) => {
			await tx.delete(websites).where(eq(websites.id, websiteId));
		});

		await invalidateWebsiteCaches(websiteId, userId);

		return { success: true };
	}

	async toggleWebsitePublic(
		websiteId: string,
		isPublic: boolean,
		userId: string
	) {
		const [updatedWebsite] = await this.db
			.update(websites)
			.set({ isPublic })
			.where(eq(websites.id, websiteId))
			.returning();

		if (!updatedWebsite) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Website not found',
			});
		}

		await invalidateWebsiteCaches(websiteId, userId);

		return updatedWebsite;
	}

	async transferWebsite(
		websiteId: string,
		organizationId: string | null,
		userId: string
	) {
		const [transferredWebsite] = await this.db
			.update(websites)
			.set({
				organizationId,
				updatedAt: new Date(),
			})
			.where(eq(websites.id, websiteId))
			.returning();

		if (!transferredWebsite) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Website not found',
			});
		}

		logger.info(
			'Website Transferred',
			`Website "${transferredWebsite.name}" was transferred to organization "${organizationId}"`,
			{
				websiteId: transferredWebsite.id,
				organizationId,
				userId,
			}
		);

		await invalidateWebsiteCaches(websiteId, userId);

		return transferredWebsite;
	}
}
