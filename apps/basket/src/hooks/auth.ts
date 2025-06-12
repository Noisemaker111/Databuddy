/**
 * Website Authentication Hook for Analytics
 * 
 * This hook provides authentication for website tracking by validating 
 * client IDs and origins against registered websites.
 */

import { db, eq, websites } from '@databuddy/db';
import { cacheable } from '@databuddy/redis';
import { logger } from '../lib/logger';

// Cache the website lookup
export const getWebsiteById = cacheable(
  async (id: string): Promise<any> => {
    logger.debug('Fetching website from database', { id });
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

/**
 * Validates if an origin header matches or is a subdomain of the allowed domain
 * 
 * @param originHeader - The Origin header value from the request
 * @param allowedDomain - The domain to validate against (can include protocol, port, www prefix)
 * @returns true if origin is valid, false otherwise
 * 
 * @example
 * isValidOrigin('https://app.example.com', 'example.com') // true
 * isValidOrigin('https://example.com', 'https://www.example.com:3000') // true  
 * isValidOrigin('https://malicious.com', 'example.com') // false
 * isValidOrigin('http://localhost:3000', 'localhost') // true
 */
export function isValidOrigin(originHeader: string, allowedDomain: string): boolean {
  if (!originHeader?.trim()) {
    return true;
  }
  if (!allowedDomain?.trim()) {
    logger.warn(new Error('[isValidOrigin] No allowed domain provided'));
    return false;
  }
  try {
    const normalizedAllowedDomain = normalizeDomain(allowedDomain.trim());
    const originUrl = new URL(originHeader.trim());
    const normalizedOriginDomain = normalizeDomain(originUrl.hostname);
    if (normalizedOriginDomain === normalizedAllowedDomain) {
      return true;
    }
    if (isSubdomain(normalizedOriginDomain, normalizedAllowedDomain)) {
      return true;
    }
    return false;
  } catch (error) {
    logger.error(new Error(`[isValidOrigin] Validation failed: ${error instanceof Error ? error.message : String(error)}`));
    return false;
  }
}

/**
 * Normalizes a domain by removing protocol, port, and www prefix
 * 
 * @param domain - Domain string to normalize
 * @returns Normalized domain string
 */
function normalizeDomain(domain: string): string {
  let normalized = domain.toLowerCase();
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    normalized = new URL(normalized).hostname;
  } else {
    normalized = normalized.split(':')[0];
  }
  normalized = normalized.replace(/^www\./, '');
  if (!isValidDomainFormat(normalized)) {
    throw new Error(`Invalid domain format after normalization: ${normalized}`);
  }
  return normalized;
}

/**
 * Checks if originDomain is a subdomain of allowedDomain
 * 
 * @param originDomain - The origin domain to check
 * @param allowedDomain - The allowed parent domain
 * @returns true if originDomain is a subdomain of allowedDomain
 */
function isSubdomain(originDomain: string, allowedDomain: string): boolean {
  return originDomain.endsWith(`.${allowedDomain}`) && 
         originDomain.length > allowedDomain.length + 1;
}

/**
 * Basic domain format validation
 * 
 * @param domain - Domain to validate
 * @returns true if domain appears to be valid format
 */
function isValidDomainFormat(domain: string): boolean {
  return domain.length > 0 && 
         domain.length <= 253 &&
         !domain.startsWith('.') && 
         !domain.endsWith('.') &&
         !domain.includes('..') &&
         /^[a-zA-Z0-9.-]+$/.test(domain);
}

// Enhanced version with additional security features
export function isValidOriginSecure(
  originHeader: string, 
  allowedDomain: string,
  options: {
    allowLocalhost?: boolean;
    allowedSubdomains?: string[];
    blockedSubdomains?: string[];
    requireHttps?: boolean;
  } = {}
): boolean {
  const {
    allowLocalhost = false,
    allowedSubdomains = [],
    blockedSubdomains = [],
    requireHttps = false
  } = options;

  if (!originHeader?.trim()) {
    return true;
  }

  if (!allowedDomain?.trim()) {
    return false;
  }

  try {
    const originUrl = new URL(originHeader.trim());
    
    // HTTPS requirement check
    if (requireHttps && originUrl.protocol !== 'https:') {
      return false;
    }

    // Localhost handling
    if (isLocalhost(originUrl.hostname)) {
      return allowLocalhost;
    }

    const normalizedAllowedDomain = normalizeDomain(allowedDomain.trim());
    const normalizedOriginDomain = normalizeDomain(originUrl.hostname);

    // Exact match
    if (normalizedOriginDomain === normalizedAllowedDomain) {
      return true;
    }

    // Subdomain checks
    if (isSubdomain(normalizedOriginDomain, normalizedAllowedDomain)) {
      const subdomain = normalizedOriginDomain.replace(`.${normalizedAllowedDomain}`, '');
      
      // Check blocked subdomains
      if (blockedSubdomains.includes(subdomain)) {
        return false;
      }
      
      // Check allowed subdomains (if specified, only these are allowed)
      if (allowedSubdomains.length > 0) {
        return allowedSubdomains.includes(subdomain);
      }
      
      return true;
    }

    return false;
  } catch (error) {
    logger.error(new Error(`[isValidOriginSecure] Validation failed: ${error instanceof Error ? error.message : String(error)}`));
    
    return false;
  }
}

/**
 * Checks if a hostname is localhost
 */
function isLocalhost(hostname: string): boolean {
  const localhostPatterns = [
    'localhost',
    '127.0.0.1',
    '::1',
    '0.0.0.0'
  ];
  
  return localhostPatterns.includes(hostname.toLowerCase()) ||
         hostname.match(/^127\.\d+\.\d+\.\d+$/) !== null ||
         hostname.match(/^192\.168\.\d+\.\d+$/) !== null ||
         hostname.match(/^10\.\d+\.\d+\.\d+$/) !== null ||
         hostname.match(/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/) !== null;
}