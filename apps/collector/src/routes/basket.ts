import { Hono } from 'hono';
import { z } from 'zod';
import { websiteAuthHook } from '../hooks/auth';
import { processEvent } from '../controllers/analytics.controller';
import type { AppVariables, TrackingEvent } from '../types';
import { parseUserAgent } from '../utils/user-agent';
import { parseIp, anonymizeIp } from '../utils/ip-geo';
import { parseReferrer } from '../utils/referrer';

// Initialize logger
const logger = console;

// Create a new basket router
const basketRouter = new Hono<{ Variables: AppVariables & { enriched?: any } }>();

// Apply website authentication hook first to get website info
basketRouter.use(websiteAuthHook());

// Add CORS middleware with dynamic origin based on website domain
basketRouter.use('*', async (c, next) => {
  const origin = c.req.header('origin');

  // Requests without an Origin header are not standard CORS requests (e.g., sendBeacon, server-to-server).
  // They don't need specific CORS origin/credentials headers.
  if (!origin) {
    // Handle OPTIONS preflight even without origin if needed by some clients/proxies
    if (c.req.method === 'OPTIONS') {
      c.header('Access-Control-Allow-Methods', 'POST, OPTIONS, GET, PING');
      c.header('Access-Control-Allow-Headers', 'Content-Type, databuddy-client-id, databuddy-sdk-name, databuddy-sdk-version');
      c.header('Access-Control-Max-Age', '600');
      return c.newResponse(null, 204);
    }
    return next(); // Proceed for non-OPTIONS requests without origin
  }

  // --- We have an origin, handle CORS ---
  let allowedOrigin = ''; // Determine if we should allow this origin

  try {
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      allowedOrigin = origin;
    } else {
      // Validate against website domain for non-localhost requests
      const website = c.get('website');
      let domain = website?.domain || '';
      if (domain.startsWith('http://') || domain.startsWith('https://')) {
        domain = new URL(domain).hostname;
      }
      const originHostname = new URL(origin).hostname;

      // Allow if origin matches website domain or is a subdomain
      if (domain && (originHostname === domain || originHostname.endsWith(`.${domain}`))) {
        allowedOrigin = origin;
      } else {
         // Origin mismatch. Log it, but still allow the specific origin as requested previously.
         // This might be needed for cases like sendBeacon if it unexpectedly includes an origin header.
         logger.warn('Origin mismatch but allowing specific origin', { origin, domain, clientId: website?.id });
         allowedOrigin = origin;
         // NOTE: If sendBeacon truly doesn't need CORS, this block might be removable,
         // and mismatched origins would correctly be blocked by CORS.
      }
    }
  } catch (error) {
    // If website validation fails, don't allow the origin.
    logger.error('Error validating origin, blocking CORS', { origin, error });
    allowedOrigin = ''; // Ensure it's not allowed
  }

  // Set CORS headers *only if* the origin was explicitly allowed
  if (allowedOrigin) {
      c.header('Access-Control-Allow-Origin', allowedOrigin); // Reflect the specific allowed origin
      c.header('Access-Control-Allow-Credentials', 'true');   // MUST be true because client sends credentials
      c.header('Access-Control-Allow-Methods', 'POST, OPTIONS, GET, PING');
      c.header('Access-Control-Allow-Headers', 'Content-Type, databuddy-client-id, databuddy-sdk-name, databuddy-sdk-version');
      c.header('Access-Control-Max-Age', '600');
  } else {
      // Origin not allowed. For OPTIONS, still respond correctly but without Allow-Origin/Credentials.
      if (c.req.method === 'OPTIONS') {
        c.header('Access-Control-Allow-Methods', 'POST, OPTIONS, GET, PING');
        c.header('Access-Control-Allow-Headers', 'Content-Type, databuddy-client-id, databuddy-sdk-name, databuddy-sdk-version');
        c.header('Access-Control-Max-Age', '600');
      }
      // For non-OPTIONS requests, no CORS headers are set, so the browser should block the request.
  }

  // Handle OPTIONS preflight requests
  if (c.req.method === 'OPTIONS') {
    // Respond with 204 No Content. Headers are set appropriately above.
    return c.newResponse(null, 204);
  }

  // If origin was not allowed, block the actual request
  if (!allowedOrigin) {
    logger.warn('Blocked non-OPTIONS request due to disallowed origin', { origin });
    return c.json({ status: 'error', message: 'Origin not allowed' }, 403);
  }

  // Origin was allowed, proceed to the next middleware/handler
  return next();
});

// Define the event validation schema
const eventSchema = z.strictObject({
  type: z.enum(['track', 'alias', 'increment', 'decrement']),
  payload: z.object({
    name: z.string().optional(),
    anonymousId: z.string().optional(),
    profileId: z.string().optional(),
    properties: z.record(z.any()).optional(),
    property: z.string().optional(),
    value: z.number().optional(),
    screen_resolution: z.string().optional(),
    viewport_size: z.string().optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
    timezone_offset: z.number().nullable().optional(),
    connection_type: z.string().optional(),
    connection_speed: z.string().optional(),
    rtt: z.number().nullable().optional(),
    load_time: z.number().nullable().optional(),
    dom_ready_time: z.number().nullable().optional(),
    ttfb: z.number().nullable().optional(),
    redirect_time: z.number().nullable().optional(),
    domain_lookup_time: z.number().nullable().optional(),
    connection_time: z.number().nullable().optional(),
    request_time: z.number().nullable().optional(),
    render_time: z.number().nullable().optional(),
    fcp: z.number().nullable().optional(),
    lcp: z.number().nullable().optional(),
    cls: z.number().nullable().optional(),
    page_size: z.number().nullable().optional(),
    time_on_page: z.number().nullable().optional(),
    page_count: z.number().nullable().optional(),
    scroll_depth: z.number().nullable().optional(),
    interaction_count: z.number().nullable().optional(),
    exit_intent: z.number().optional(),
    title: z.string().optional(),
    path: z.string().optional(),
    session_id: z.string().optional(),
    session_start_time: z.string().optional(),
    referrer: z.string().optional(),
    referrer_type: z.string().optional(),
    referrer_name: z.string().optional(),
    sdk_name: z.string().optional(),
    sdk_version: z.string().optional(),
    __raw_properties: z.record(z.any()).optional(),
    __enriched: z.any().optional()
  }).strict()
}).strict() as z.ZodType<TrackingEvent>;

// Define batch events validation schema
const batchEventsSchema = z.array(eventSchema);

// Middleware to enrich events with metadata
basketRouter.use('*', async (c, next) => {
  const userAgent = c.req.header('user-agent') || '';
  const referrer = c.req.header('referer') || '';
  const url = new URL(c.req.url);
  const language = c.req.header('accept-language')?.split(',')[0] || '';

  // Parse user agent info
  const uaInfo = parseUserAgent(userAgent);
  
  // Skip bot traffic
  if (uaInfo.bot.isBot) {
    logger.info('Skipping bot request', { userAgent });
    return c.json({ status: 'skipped', message: 'Bot request' }, 200);
  }

  // Get geo location from headers
  const headers = new Headers();
  for (const [key, value] of Object.entries(c.req.header())) {
    if (value) headers.append(key, value);
  }
  
  const request = new Request(c.req.url, {
    headers,
    method: c.req.method
  });
  
  const geo = await parseIp(request);
  const referrerInfo = parseReferrer(referrer);
  const urlParams = new URLSearchParams(url.search);

  // Add enriched data to context matching ClickHouse schema
  c.set('enriched', {
    url: url.toString(),
    path: url.pathname,
    title: '',
    user_agent: userAgent,
    browser: uaInfo.browser,
    browser_version: '',
    os: uaInfo.os,
    os_version: '',
    device_type: uaInfo.device,
    device_vendor: '',
    device_model: '',
    screen_resolution: '',
    viewport_size: '',
    language,
    timezone: geo.timezone || '',
    timezone_offset: null,
    connection_type: '',
    connection_speed: '',
    rtt: null,
    ip: anonymizeIp(geo.ip || ''),
    country: geo.country || '',
    region: geo.region || '',
    city: geo.city || '',
    referrer: referrerInfo.url,
    utm_source: urlParams.get('utm_source') || '',
    utm_medium: urlParams.get('utm_medium') || '',
    utm_campaign: urlParams.get('utm_campaign') || '',
    utm_term: urlParams.get('utm_term') || '',
    utm_content: urlParams.get('utm_content') || '',
    load_time: null,
    dom_ready_time: null,
    ttfb: null,
    redirect_time: null,
    domain_lookup_time: null,
    connection_time: null,
    request_time: null,
    render_time: null,
    fcp: null,
    lcp: null,
    cls: null,
    page_size: null,
    time_on_page: null,
    page_count: null,
    scroll_depth: null,
    interaction_count: null,
    exit_intent: 0
  });

  await next();
});

// Handle single analytics event with validation
basketRouter.post('/', async (c) => {
  const validationResult = eventSchema.safeParse(await c.req.json());
  
  if (!validationResult.success) {
    return c.json({ 
      status: 'error', 
      message: 'Invalid event data',
      errors: validationResult.error.issues
    }, 400);
  }
  
  const enriched = c.get('enriched');
  const properties = validationResult.data.payload.properties || {};
  
  // Map properties to clickhouse schema
  const mappedEvent = {
    ...validationResult.data,
    payload: {
      ...validationResult.data.payload,
      screen_resolution: properties.screen_resolution || '',
      viewport_size: properties.viewport_size || '',
      language: properties.language || enriched.language || '',
      timezone: properties.timezone || enriched.timezone || '',
      timezone_offset: properties.timezone_offset || null,
      connection_type: properties.connection_type || '',
      connection_speed: properties.connection_speed || '',
      rtt: properties.rtt || null,
      load_time: properties.load_time || null,
      dom_ready_time: properties.dom_ready_time || null,
      ttfb: properties.ttfb || null,
      redirect_time: properties.redirect_time || null,
      domain_lookup_time: properties.domain_lookup_time || null,
      connection_time: properties.connection_time || null,
      request_time: properties.request_time || null,
      render_time: properties.render_time || null,
      fcp: properties.fcp || null,
      lcp: properties.lcp || null,
      cls: properties.cls || null,
      page_size: properties.page_size || null,
      time_on_page: properties.time_on_page || null,
      page_count: properties.page_count || null,
      scroll_depth: properties.scroll_depth || null,
      interaction_count: properties.interaction_count || null,
      exit_intent: properties.exit_intent || 0,
      title: properties.__title || '',
      path: properties.__path || enriched.path,
      session_id: properties.sessionId,
      session_start_time: properties.sessionStartTime,
      referrer: properties.__referrer || enriched.referrer,
      referrer_type: properties.__referrer_type,
      referrer_name: properties.__referrer_name,
      sdk_name: properties.__sdk_name || properties.__enriched?.sdk_name,
      sdk_version: properties.__sdk_version || properties.__enriched?.sdk_version,
      __raw_properties: properties,
      __enriched: enriched
    }
  } as TrackingEvent;
  
  c.set('event', mappedEvent);
  return processEvent(c);
});

// Handle batch analytics events with validation
basketRouter.post('/batch', async (c) => {
  const validationResult = batchEventsSchema.safeParse(await c.req.json());
  
  if (!validationResult.success) {
    return c.json({ 
      status: 'error', 
      message: 'Invalid batch events data',
      errors: validationResult.error.issues
    }, 400);
  }
  
  const enriched = c.get('enriched');
  const events = validationResult.data;
  const results = [];
  
  // Process each event in the batch
  for (const event of events) {
    const properties = event.payload.properties || {};
    
    // Map properties to clickhouse schema
    const mappedEvent = {
      ...event,
      payload: {
        ...event.payload,
        screen_resolution: properties.screen_resolution || '',
        viewport_size: properties.viewport_size || '',
        language: properties.language || enriched.language || '',
        timezone: properties.timezone || enriched.timezone || '',
        timezone_offset: properties.timezone_offset || null,
        connection_type: properties.connection_type || '',
        connection_speed: properties.connection_speed || '',
        rtt: properties.rtt || null,
        load_time: properties.load_time || null,
        dom_ready_time: properties.dom_ready_time || null,
        ttfb: properties.ttfb || null,
        redirect_time: properties.redirect_time || null,
        domain_lookup_time: properties.domain_lookup_time || null,
        connection_time: properties.connection_time || null,
        request_time: properties.request_time || null,
        render_time: properties.render_time || null,
        fcp: properties.fcp || null,
        lcp: properties.lcp || null,
        cls: properties.cls || null,
        page_size: properties.page_size || null,
        time_on_page: properties.time_on_page || null,
        page_count: properties.page_count || null,
        scroll_depth: properties.scroll_depth || null,
        interaction_count: properties.interaction_count || null,
        exit_intent: properties.exit_intent || 0,
        title: properties.__title || '',
        path: properties.__path || enriched.path,
        session_id: properties.sessionId,
        session_start_time: properties.sessionStartTime,
        referrer: properties.__referrer || enriched.referrer,
        referrer_type: properties.__referrer_type,
        referrer_name: properties.__referrer_name,
        sdk_name: properties.__sdk_name || properties.__enriched?.sdk_name,
        sdk_version: properties.__sdk_version || properties.__enriched?.sdk_version,
        __raw_properties: properties,
        __enriched: enriched
      }
    } as TrackingEvent;
    
    // Process each event
    c.set('event', mappedEvent);
    try {
      const result = await processEvent(c);
      const resultData = await result.json();
      results.push({
        status: resultData.status,
        eventName: event.payload.name,
        anonymousId: event.payload.anonymousId?.substring(0, 8)
      });
    } catch (error) {
      results.push({
        status: 'error',
        eventName: event.payload.name,
        anonymousId: event.payload.anonymousId?.substring(0, 8),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  return c.json({
    status: 'success',
    message: `Processed ${events.length} events`,
    processed: results
  }, 200);
});

export { basketRouter }; 