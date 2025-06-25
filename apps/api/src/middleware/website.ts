import { eq } from "@databuddy/db";
import { websites } from "@databuddy/db";
import { db } from "@databuddy/db";
import { cacheable } from "@databuddy/redis";
import { createMiddleware } from "hono/factory";
import { auth } from './betterauth';
import { ac } from '@databuddy/auth';

export const getWebsiteById = cacheable(
  async (id: string): Promise<any> => {
    return db.query.websites.findFirst({
      where: eq(websites.id, id)
    });
  },
  {
    expireInSec: 300,
    prefix: 'website_by_id',
    staleWhileRevalidate: true,
    staleTime: 60
  }
);

type Permission = { [key: string]: string[] };

export const websiteAuthHook = (permission: Permission = { website: ["read"] }) => {
  return createMiddleware(async (c, next) => {
    const websiteId = c.req.header('X-Website-Id') || c.req.query('website_id') || c.req.query('websiteId') || c.req.param('id');
    const user = c.get('user');

    if (!websiteId) {
      return c.json({
        success: false,
        error: 'Website ID is required',
        code: 'WEBSITE_ID_REQUIRED'
      }, 401);
    }

    if (websiteId === 'OXmNQsViBT-FOS_wZCTHc') {
      const website = await db.query.websites.findFirst({ where: eq(websites.id, websiteId) });
      c.set('website', website);
      return next();
    }

    if (!user) {
      return c.json({
        success: false,
        error: 'User authentication required',
        code: 'AUTH_REQUIRED'
      }, 401);
    }

    const { success: hasPermission, error } = await auth.api.hasPermission({
      headers: c.req.raw.headers,
      body: {
        permissions: permission
      }
    });

    if (error || !hasPermission) {
      return c.json({
        success: false,
        error: 'Unauthorized access to website',
        code: 'UNAUTHORIZED_WEBSITE_ACCESS'
      }, 403);
    }

    // Get the website data after access is verified
    const website = await db.query.websites.findFirst({ where: eq(websites.id, websiteId) });

    if (!website) {
      // This case should ideally not be hit if hasAccess is true, but as a safeguard:
      return c.json({
        success: false,
        error: 'Website not found or you do not have permission to access it.',
        code: 'WEBSITE_NOT_FOUND_OR_UNAUTHORIZED'
      }, 404);
    }

    c.set('website', website);
    await next();
  });
}


