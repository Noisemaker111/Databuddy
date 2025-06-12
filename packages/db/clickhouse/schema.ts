import { clickHouse } from './client';


// Define the analytics database schema with tables for events, sessions, and aggregated data
const ANALYTICS_DATABASE = 'analytics';

// SQL statements for creating the analytics database and tables
const CREATE_DATABASE = `
CREATE DATABASE IF NOT EXISTS ${ANALYTICS_DATABASE}
`;

// Optimizations:
// 1. Use LowCardinality(String) for fields with limited distinct values
// 2. Reorder ORDER BY to prioritize time-based queries
// 3. Add materialized views for common aggregations
// 4. Remove Nullable where 0 is a sensible default


// Events table stores all raw events
const CREATE_EVENTS_TABLE = `
CREATE TABLE IF NOT EXISTS ${ANALYTICS_DATABASE}.events (
  id UUID,
  client_id String,
  event_name String,
  anonymous_id String,
  time DateTime64(3, 'UTC'),
  session_id String,
  
  event_type LowCardinality(String) DEFAULT 'track', -- 'track', 'error', 'web_vitals'
  event_id Nullable(String), -- UUID from client for deduplication
  session_start_time Nullable(DateTime64(3, 'UTC')), -- New session tracking
  timestamp DateTime64(3, 'UTC') DEFAULT time, -- Alias for new format
  
  referrer Nullable(String),
  url String,
  path String,
  title Nullable(String),
  
  ip String,
  user_agent String,
  browser_name Nullable(String),
  browser_version Nullable(String),
  os_name Nullable(String),
  os_version Nullable(String),
  device_type Nullable(String),
  device_brand Nullable(String),
  device_model Nullable(String),
  country Nullable(String),
  region Nullable(String),
  city Nullable(String),
  
  screen_resolution Nullable(String),
  viewport_size Nullable(String),
  language Nullable(String),
  timezone Nullable(String),
  
  connection_type Nullable(String),
  rtt Nullable(Int16),
  downlink Nullable(Float32), -- New field
  
  time_on_page Nullable(Float32),
  scroll_depth Nullable(Float32),
  interaction_count Nullable(Int16),
  exit_intent UInt8,
  page_count UInt8 DEFAULT 1,
  is_bounce UInt8 DEFAULT 1,
  has_exit_intent Nullable(UInt8), -- New field
  page_size Nullable(Int32),
  
  utm_source Nullable(String),
  utm_medium Nullable(String),
  utm_campaign Nullable(String),
  utm_term Nullable(String),
  utm_content Nullable(String),
  
  load_time Nullable(Int32),
  dom_ready_time Nullable(Int32),
  dom_interactive Nullable(Int32), -- New field
  ttfb Nullable(Int32),
  connection_time Nullable(Int32),
  request_time Nullable(Int32),
  render_time Nullable(Int32),
  redirect_time Nullable(Int32), -- New field
  domain_lookup_time Nullable(Int32), -- New field
  
  fcp Nullable(Int32),
  lcp Nullable(Int32),
  cls Nullable(Float32),
  fid Nullable(Int32), -- New field
  inp Nullable(Int32), -- New field
  
  href Nullable(String),
  text Nullable(String),
  
  value Nullable(String),
  
  error_message Nullable(String),
  error_filename Nullable(String),
  error_lineno Nullable(Int32),
  error_colno Nullable(Int32),
  error_stack Nullable(String),
  error_type Nullable(String),
  
  properties String,
  
  created_at DateTime64(3, 'UTC')
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(time)
ORDER BY (client_id, time, id)
TTL toDateTime(time) + INTERVAL 24 MONTH
SETTINGS index_granularity = 8192
`;

// Dedicated errors table for error events
const CREATE_ERRORS_TABLE = `
CREATE TABLE IF NOT EXISTS ${ANALYTICS_DATABASE}.errors (
  id UUID,
  client_id String,
  event_id Nullable(String),
  
  anonymous_id String,
  session_id String,
  timestamp DateTime64(3, 'UTC'),
  
  path String,
  
  message String,
  filename Nullable(String),
  lineno Nullable(Int32),
  colno Nullable(Int32),
  stack Nullable(String),
  error_type Nullable(String),
  
  ip Nullable(String),
  user_agent Nullable(String),
  browser_name Nullable(String),
  browser_version Nullable(String),
  os_name Nullable(String),
  os_version Nullable(String),
  device_type Nullable(String),
  country Nullable(String),
  region Nullable(String),
  
  created_at DateTime64(3, 'UTC')
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (client_id, timestamp, id)
TTL toDateTime(timestamp) + INTERVAL 12 MONTH
SETTINGS index_granularity = 8192
`;

// Dedicated web vitals table for performance metrics
const CREATE_WEB_VITALS_TABLE = `
CREATE TABLE IF NOT EXISTS ${ANALYTICS_DATABASE}.web_vitals (
  id UUID,
  client_id String,
  event_id Nullable(String),
  
  anonymous_id String,
  session_id String,
  timestamp DateTime64(3, 'UTC'),
  
  path String,
  
  fcp Nullable(Int32),
  lcp Nullable(Int32),
  cls Nullable(Float32),
  fid Nullable(Int32),
  inp Nullable(Int32),
  
  ip Nullable(String),
  user_agent Nullable(String),
  browser_name Nullable(String),
  browser_version Nullable(String),
  os_name Nullable(String),
  os_version Nullable(String),
  device_type Nullable(String),
  country Nullable(String),
  region Nullable(String),
  
  created_at DateTime64(3, 'UTC')
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (client_id, timestamp, id)
TTL toDateTime(timestamp) + INTERVAL 6 MONTH
SETTINGS index_granularity = 8192
`;

// TypeScript interfaces for the specialized tables
export interface ErrorEvent {
  id: string;
  client_id: string;
  event_id?: string;
  anonymous_id: string;
  session_id: string;
  timestamp: number;
  path: string;
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  error_type?: string;
  ip?: string;
  user_agent?: string;
  browser_name?: string;
  browser_version?: string;
  os_name?: string;
  os_version?: string;
  device_type?: string;
  country?: string;
  region?: string;
  created_at: number;
}

export interface WebVitalsEvent {
  id: string;
  client_id: string;
  event_id?: string;
  anonymous_id: string;
  session_id: string;
  timestamp: number;
  path: string;
  fcp?: number;
  lcp?: number;
  cls?: number;
  fid?: number;
  inp?: number;
  ip?: string;
  user_agent?: string;
  browser_name?: string;
  browser_version?: string;
  os_name?: string;
  os_version?: string;
  device_type?: string;
  country?: string;
  region?: string;
  created_at: number;
}

// TypeScript interface that matches the ClickHouse schema
export interface AnalyticsEvent {
  // Core identification
  id: string;
  client_id: string;
  event_name: string;
  anonymous_id: string;
  time: number;
  session_id: string;
  
  // New fields
  event_type?: 'track' | 'error' | 'web_vitals';
  event_id?: string;
  session_start_time?: number;
  timestamp?: number;
  
  // Page context
  referrer?: string;
  url: string;
  path: string;
  title?: string;
  
  // Server enrichment
  ip: string;
  user_agent: string;
  browser_name?: string;
  browser_version?: string;
  os_name?: string;
  os_version?: string;
  device_type?: string;
  device_brand?: string;
  device_model?: string;
  country?: string;
  region?: string;
  city?: string;
  
  // User context
  screen_resolution?: string;
  viewport_size?: string;
  language?: string;
  timezone?: string;
  
  // Connection info
  connection_type?: string;
  rtt?: number;
  downlink?: number;
  
  // Engagement metrics
  time_on_page?: number;
  scroll_depth?: number;
  interaction_count?: number;
  exit_intent: number;
  page_count: number;
  is_bounce: number;
  has_exit_intent?: number;
  page_size?: number;
  
  // UTM parameters
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  
  // Performance metrics
  load_time?: number;
  dom_ready_time?: number;
  dom_interactive?: number;
  ttfb?: number;
  connection_time?: number;
  request_time?: number;
  render_time?: number;
  redirect_time?: number;
  domain_lookup_time?: number;
  
  // Web Vitals
  fcp?: number;
  lcp?: number;
  cls?: number;
  fid?: number;
  inp?: number;
  
  // Link tracking
  href?: string;
  text?: string;
  
  // Custom event value
  value?: string;
  
  // Error tracking
  error_message?: string;
  error_filename?: string;
  error_lineno?: number;
  error_colno?: number;
  error_stack?: string;
  error_type?: string;
  
  // Legacy properties
  properties: string;
  
  // Metadata
  created_at: number;
}

/**
 * Initialize the ClickHouse schema by creating necessary database and tables
 */
export async function initClickHouseSchema() {
  try {
    console.info('Initializing ClickHouse schema...');
    
    // Create the analytics database
    await clickHouse.command({
      query: CREATE_DATABASE,
    });
    console.info(`Created database: ${ANALYTICS_DATABASE}`);
    
    // Create tables
    const tables = [
      { name: 'events', query: CREATE_EVENTS_TABLE },
      { name: 'errors', query: CREATE_ERRORS_TABLE },
      { name: 'web_vitals', query: CREATE_WEB_VITALS_TABLE },
    ];
    
    for (const table of tables) {
      await clickHouse.command({
        query: table.query,
      });
      console.info(`Created table: ${ANALYTICS_DATABASE}.${table.name}`);
    }
    
    console.info('ClickHouse schema initialization completed successfully');
    return {
      success: true,
      message: 'ClickHouse schema initialized successfully',
      details: {
        database: ANALYTICS_DATABASE,
        tables: tables.map(t => t.name)
      }
    };
  } catch (error) {
    console.error('Error initializing ClickHouse schema:', error);
    return {
      success: false,
      message: 'Failed to initialize ClickHouse schema',
      error: error instanceof Error ? error.message : String(error)
    };
  }
} 