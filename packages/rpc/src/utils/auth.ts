import type { Context } from '../trpc';
import { TRPCError } from '@trpc/server';
import { db, eq, websites } from '@databuddy/db';
import { cacheable } from '@databuddy/redis';
import { logger } from '@databuddy/shared';

type Permission = 'read' | 'update' | 'delete' | 'transfer';

const getWebsiteById = async (id: string) => {
    try {
        if (!id) return null;
        return await db.query.websites.findFirst({
            where: eq(websites.id, id),
        });
    } catch (error) {
        console.error('Error fetching website by ID:', { error, id });
        return null;
    }
};

/**
 * A utility to centralize authorization checks for websites.
 * It verifies if a user has the required permissions for a specific website,
 * checking for ownership or organization roles.
 *
 * @throws {TRPCError} if the user is not authorized.
 */
export async function authorizeWebsiteAccess(
    ctx: Context,
    websiteId: string,
    permission: Permission
) {
    const website = await getWebsiteById(websiteId);

    // Log access check attempt
    logger.info('[authorizeWebsiteAccess]', 'Access check', {
        websiteId,
        userId: ctx.user?.id ?? null,
        permission
    });

    if (!website) {
        logger.info('[authorizeWebsiteAccess]', 'denied', { websiteId, userId: ctx.user?.id ?? null, reason: 'not found' });
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Website not found.' });
    }

    if (permission === 'read' && website.isPublic) {
        logger.info('[authorizeWebsiteAccess]', 'granted', { websiteId, userId: ctx.user?.id ?? null, permission });
        return website;
    }

    if (!ctx.user) {
        logger.info('[authorizeWebsiteAccess]', 'denied', { websiteId, userId: null, reason: 'no user' });
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication is required for this action.' });
    }

    if (ctx.user.role === 'ADMIN') {
        logger.info('[authorizeWebsiteAccess]', 'granted', { websiteId, userId: ctx.user.id, permission, role: 'ADMIN' });
        return website;
    }

    if (website.organizationId) {
        const { success } = await ctx.auth.api.hasPermission({
            headers: ctx.headers,
            body: { permissions: { website: [permission] } }
        });
        if (!success) {
            logger.info('[authorizeWebsiteAccess]', 'denied', { websiteId, userId: ctx.user.id, reason: 'forbidden (org permission)' });
            throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' });
        }
    } else {
        if (website.userId !== ctx.user.id) {
            logger.info('[authorizeWebsiteAccess]', 'denied', { websiteId, userId: ctx.user.id, reason: 'not owner' });
            throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not the owner of this website.' });
        }
    }

    logger.info('[authorizeWebsiteAccess]', 'granted', { websiteId, userId: ctx.user.id, permission });
    return website;
} 