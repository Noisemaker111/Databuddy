import type { MiddlewareHandler } from 'hono';
import { prisma, WebsiteStatus } from '@databuddy/db';
import type { AppVariables, Website } from '../types';
import { cacheable } from '@databuddy/redis';

// Initialize logger
const logger = console;

// Cache the website lookup for 5 minutes
export const getWebsiteById = cacheable(
  async (id: string): Promise<Website | null> => {
    logger.debug('Fetching website from database', { id });
    const website = await prisma.website.findUnique({
      where: { id }
    });
    return website ? {
      ...website,
      name: website.name || '',
      userId: website.userId || '',
      projectId: website.projectId || ''
    } : null;
  },
  {
    expireInSec: 300, // 5 minutes
    prefix: 'website_by_id',
    staleWhileRevalidate: true,
    staleTime: 60, // Refresh if less than 60 seconds TTL remains
  }
);

// Create website authentication middleware
export const websiteAuthHook = (): MiddlewareHandler<{
  Variables: AppVariables;
}> => {
  return async (c, next) => {
    // For OPTIONS requests, skip all validation
    if (c.req.method === 'OPTIONS') {
      return next();
    }

    // First try to get client ID from header
    let clientId = c.req.header('databuddy-client-id');
    
    // If no header, try to get from URL parameters (for beacon API compatibility)
    if (!clientId || clientId === 'undefined') {
      const url = new URL(c.req.url);
      clientId = url.searchParams.get('client_id') || '';
      
      // If still no client ID, return 401
      if (!clientId) {
        logger.warn('Missing client ID', { url: c.req.url });
        return c.json({ error: 'Missing or invalid client ID' }, 401);
      }
    }
    
    try {
      // Look up website in Redis cache, falling back to database
      const website = await getWebsiteById(clientId);
      
      // If website doesn't exist, reject
      if (!website) {
        logger.warn('Unknown website ID', { clientId });
        return c.json({ error: 'Invalid client ID' }, 401);
      }
      
      // If website is inactive, reject
      if (website.status !== WebsiteStatus.ACTIVE) {
        logger.warn('Inactive website', { clientId, status: website.status });
        return c.json({ error: 'Website is not active' }, 403);
      }
      
      // Set the website in the context
      c.set('website', {
        id: website.id,
        name: website.name,
        domain: website.domain,
        status: website.status,
        userId: website.userId,
        projectId: website.projectId,
        createdAt: website.createdAt,
        updatedAt: website.updatedAt,
        deletedAt: website.deletedAt
      });
      
      await next();
    } catch (error) {
      logger.error('Error validating website', { clientId, error });
      return c.json({ error: 'Authentication error', details: error }, 500);
    }
  };
}; 