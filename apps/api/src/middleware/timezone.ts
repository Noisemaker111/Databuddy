/**
 * Timezone middleware for detecting and adding timezone information to request context
 */

import { createMiddleware } from 'hono/factory';
import { z } from 'zod';
import { detectUserTimezone, isValidTimezone, type TimezoneInfo } from '../utils/timezone';
import type { AppVariables } from '../types';

// Timezone query parameter schema
export const timezoneQuerySchema = z.object({
  timezone: z.string().optional().refine((tz) => {
    if (!tz) return true;
    return isValidTimezone(tz);
  }, 'Invalid timezone'),
});

// Extended context type with timezone
export interface TimezoneContext {
  Variables: AppVariables & {
    timezoneInfo?: TimezoneInfo;
  };
}

/**
 * Middleware to detect and add timezone information to context
 */
export const timezoneMiddleware = createMiddleware<TimezoneContext>(async (c, next) => {
  try {
    // Get explicit timezone from query parameters if provided
    const url = new URL(c.req.url);
    const explicitTimezone = url.searchParams.get('timezone') || undefined;
    
    // Detect timezone from headers and explicit parameter
    const timezoneInfo = detectUserTimezone(c.req.raw.headers, explicitTimezone);
    
    // Add timezone info to context
    c.set('timezoneInfo', timezoneInfo);
    
    await next();
  } catch (error) {
    // If timezone detection fails, set default UTC
    c.set('timezoneInfo', {
      timezone: 'UTC',
      detected: false,
      source: 'default'
    });
    
    await next();
  }
});

/**
 * Hook to get timezone info from context
 */
export function useTimezone(c: any): TimezoneInfo {
  const timezoneInfo = c.get('timezoneInfo');
  return timezoneInfo || {
    timezone: 'UTC',
    detected: false,
    source: 'default'
  };
} 