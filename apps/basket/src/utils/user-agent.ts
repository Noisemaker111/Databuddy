/**
 * User Agent Utilities
 * 
 * Provides functions for user agent analysis including bot detection
 * and platform identification.
 */

import { UAParser } from 'ua-parser-js';

export interface UserAgentInfo {
  bot: {
    isBot: boolean;
    name?: string;
    type?: string;
  };
  browser?: string;
  os?: string;
  device?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
}

/**
 * Parse user agent to extract useful information
 */
export function parseUserAgent(userAgent: string): {
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
} {
  if (!userAgent) {
    return {
      browserName: undefined,
      browserVersion: undefined,
      osName: undefined,
      osVersion: undefined,
      deviceType: undefined,
      deviceBrand: undefined,
      deviceModel: undefined,
    };
  }

  try {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    return {
      browserName: result.browser.name || undefined,
      browserVersion: result.browser.version || undefined,
      osName: result.os.name || undefined,
      osVersion: result.os.version || undefined,
      deviceType: result.device.type || undefined,
      deviceBrand: result.device.vendor || undefined,
      deviceModel: result.device.model || undefined,
    };
  } catch (error) {
    // If parsing fails, return undefined values
    return {
      browserName: undefined,
      browserVersion: undefined,
      osName: undefined,
      osVersion: undefined,
      deviceType: undefined,
      deviceBrand: undefined,
      deviceModel: undefined,
    };
  }
}