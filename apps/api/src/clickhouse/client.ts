import type { LogParams, ErrorLogParams, WarnLogParams, Logger, ResponseJSON } from '@clickhouse/client';
import { ClickHouseLogLevel, createClient } from '@clickhouse/client';
import type { NodeClickHouseClientConfigOptions } from '@clickhouse/client/dist/config';

// Define the analytics database schema with tables for events, sessions, and aggregated data
const ANALYTICS_DATABASE = 'analytics';

// SQL statements for creating the analytics database and tables
const CREATE_DATABASE = `
CREATE DATABASE IF NOT EXISTS ${ANALYTICS_DATABASE}
`;

// Events table stores all raw events
const CREATE_EVENTS_TABLE = `
CREATE TABLE IF NOT EXISTS ${ANALYTICS_DATABASE}.events (
  id UUID,
  client_id String,
  event_name String,
  anonymous_id String,
  time DateTime64(3, 'UTC'),
  session_id String,
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
  screen_resolution Nullable(String),
  viewport_size Nullable(String),
  language Nullable(String),
  timezone Nullable(String),
  connection_type Nullable(String),
  rtt Nullable(Int16),
  time_on_page Nullable(Float32),
  country Nullable(String),
  region Nullable(String),
  city Nullable(String),
  utm_source Nullable(String),
  utm_medium Nullable(String),
  utm_campaign Nullable(String),
  utm_term Nullable(String),
  utm_content Nullable(String),
  load_time Nullable(Int32),
  dom_ready_time Nullable(Int32),
  ttfb Nullable(Int32),
  connection_time Nullable(Int32),
  request_time Nullable(Int32),
  render_time Nullable(Int32),
  fcp Nullable(Int32),
  lcp Nullable(Int32),
  cls Nullable(Float32),
  page_size Nullable(Int32),
  scroll_depth Nullable(Float32),
  interaction_count Nullable(Int16),
  exit_intent UInt8,
  page_count UInt8 DEFAULT 1,
  is_bounce UInt8 DEFAULT 1,
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

// Sessions table for tracking user sessions
const CREATE_SESSIONS_TABLE = `
CREATE TABLE IF NOT EXISTS ${ANALYTICS_DATABASE}.sessions (
  session_id String,
  client_id String,
  anonymous_id String,
  start_time DateTime64(3, 'UTC'),
  end_time DateTime64(3, 'UTC'),
  duration Int32,
  pages Int32,
  is_bounce UInt8,
  entry_page String,
  exit_page String,
  country String,
  region String,
  city String,
  browser String,
  os String,
  device_type String,
  referrer String,
  utm_source String,
  utm_medium String,
  utm_campaign String,
  created_at DateTime64(3, 'UTC')
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(start_time)
ORDER BY (client_id, start_time, session_id)
TTL toDateTime(start_time) + INTERVAL 24 MONTH
SETTINGS index_granularity = 8192
`;

// Daily stats aggregation table
const CREATE_DAILY_STATS_TABLE = `
CREATE TABLE IF NOT EXISTS ${ANALYTICS_DATABASE}.daily_stats (
  client_id String,
  date Date,
  pageviews Int32,
  visitors Int32,
  sessions Int32,
  bounce_rate Float32,
  avg_session_duration Float32,
  created_at DateTime64(3, 'UTC')
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (client_id, date)
TTL date + INTERVAL 24 MONTH
SETTINGS index_granularity = 8192
`;

// Page stats aggregation table
const CREATE_PAGE_STATS_TABLE = `
CREATE TABLE IF NOT EXISTS ${ANALYTICS_DATABASE}.page_stats (
  client_id String,
  date Date,
  path String,
  pageviews Int32,
  visitors Int32,
  avg_time_on_page Float32,
  created_at DateTime64(3, 'UTC')
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (client_id, date, path)
TTL date + INTERVAL 24 MONTH
SETTINGS index_granularity = 8192
`;

// Referrer stats aggregation table
const CREATE_REFERRER_STATS_TABLE = `
CREATE TABLE IF NOT EXISTS ${ANALYTICS_DATABASE}.referrer_stats (
  client_id String,
  date Date,
  referrer String,
  visitors Int32,
  pageviews Int32,
  created_at DateTime64(3, 'UTC')
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (client_id, date, referrer)
TTL date + INTERVAL 24 MONTH
SETTINGS index_granularity = 8192
`;

// Location stats aggregation table
const CREATE_LOCATION_STATS_TABLE = `
CREATE TABLE IF NOT EXISTS ${ANALYTICS_DATABASE}.location_stats (
  client_id String,
  date Date,
  country String,
  region String,
  city String,
  visitors Int32,
  pageviews Int32,
  created_at DateTime64(3, 'UTC')
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (client_id, date, country, region, city)
TTL date + INTERVAL 24 MONTH
SETTINGS index_granularity = 8192
`;

// Device stats aggregation table
const CREATE_DEVICE_STATS_TABLE = `
CREATE TABLE IF NOT EXISTS ${ANALYTICS_DATABASE}.device_stats (
  client_id String,
  date Date,
  browser_name String,
  browser_version String,
  os_name String,
  os_version String,
  device_type String,
  device_brand String,
  device_model String,
  visitors Int32,
  pageviews Int32,
  created_at DateTime64(3, 'UTC')
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (client_id, date, browser_name, os_name, device_type)
TTL date + INTERVAL 24 MONTH
SETTINGS index_granularity = 8192
`;

// Performance stats aggregation table
const CREATE_PERFORMANCE_STATS_TABLE = `
CREATE TABLE IF NOT EXISTS ${ANALYTICS_DATABASE}.performance_stats (
  client_id String,
  date Date,
  path String,
  avg_load_time Float32,
  avg_dom_ready_time Float32,
  avg_ttfb Float32,
  avg_render_time Float32,
  p95_load_time Float32,
  p95_dom_ready_time Float32,
  p95_ttfb Float32,
  visitors Int32,
  pageviews Int32,
  created_at DateTime64(3, 'UTC')
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (client_id, date, path)
TTL date + INTERVAL 24 MONTH
SETTINGS index_granularity = 8192
`;

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
      { name: 'sessions', query: CREATE_SESSIONS_TABLE },
      { name: 'daily_stats', query: CREATE_DAILY_STATS_TABLE },
      { name: 'page_stats', query: CREATE_PAGE_STATS_TABLE },
      { name: 'referrer_stats', query: CREATE_REFERRER_STATS_TABLE },
      { name: 'location_stats', query: CREATE_LOCATION_STATS_TABLE },
      { name: 'device_stats', query: CREATE_DEVICE_STATS_TABLE },
      { name: 'performance_stats', query: CREATE_PERFORMANCE_STATS_TABLE }
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

export interface SqlBuilderObject {
  where: Record<string, string>;
  having: Record<string, string>;
  select: Record<string, string>;
  groupBy: Record<string, string>;
  orderBy: Record<string, string>;
  from: string;
  limit: number | undefined;
  offset: number | undefined;
}

/**
 * Creates a SQL query builder for ClickHouse
 * @param tableName Optional table name to query (defaults to events table)
 */
export function createSqlBuilder(tableName?: keyof typeof TABLE_NAMES) {
  const join = (obj: Record<string, string> | string[], joiner: string) =>
    Object.values(obj).filter(Boolean).join(joiner);

  const sb: SqlBuilderObject = {
    where: {},
    from: tableName ? TABLE_NAMES[tableName] : TABLE_NAMES.events,
    select: {},
    groupBy: {},
    orderBy: {},
    having: {},
    limit: undefined,
    offset: undefined,
  };

  const getWhere = () =>
    Object.keys(sb.where).length ? `WHERE ${join(sb.where, ' AND ')}` : '';
  const getHaving = () =>
    Object.keys(sb.having).length ? `HAVING ${join(sb.having, ' AND ')}` : '';
  const getFrom = () => `FROM ${sb.from}`;
  const getSelect = () =>
    `SELECT ${Object.keys(sb.select).length ? join(sb.select, ', ') : '*'}`;
  const getGroupBy = () =>
    Object.keys(sb.groupBy).length ? `GROUP BY ${join(sb.groupBy, ', ')}` : '';
  const getOrderBy = () =>
    Object.keys(sb.orderBy).length ? `ORDER BY ${join(sb.orderBy, ', ')}` : '';
  const getLimit = () => (sb.limit ? `LIMIT ${sb.limit}` : '');
  const getOffset = () => (sb.offset ? `OFFSET ${sb.offset}` : '');

  return {
    sb,
    join,
    getWhere,
    getFrom,
    getSelect,
    getGroupBy,
    getOrderBy,
    getHaving,
    /**
     * Set the table to query
     * @param table The table name from TABLE_NAMES
     */
    setTable: (table: keyof typeof TABLE_NAMES) => {
      sb.from = TABLE_NAMES[table];
      return sb;
    },
    /**
     * Generates the complete SQL query string
     */
    getSql: () => {
      const sql = [
        getSelect(),
        getFrom(),
        getWhere(),
        getGroupBy(),
        getHaving(),
        getOrderBy(),
        getLimit(),
        getOffset(),
      ]
        .filter(Boolean)
        .join(' ');
      return sql;
    },
  };
}

export { createClient };

/**
 * ClickHouse table names used throughout the application
 */
export const TABLE_NAMES = {
  events: 'analytics.events',
  sessions: 'analytics.sessions',
  daily_stats: 'analytics.daily_stats',
  page_stats: 'analytics.page_stats',
  referrer_stats: 'analytics.referrer_stats',
  location_stats: 'analytics.location_stats',
  device_stats: 'analytics.device_stats',
  performance_stats: 'analytics.performance_stats'
};

// const logger = createLogger('clickhouse');
const logger = console;

class CustomLogger implements Logger {
    trace({ message, args }: LogParams) {
      logger.debug(message, args);
    }
    debug({ message, args }: LogParams) {
      if (message.includes('Query:') && args?.response_status === 200) {
        return;
      }
      logger.debug(message, args);
    }
    info({ message, args }: LogParams) {
      logger.info(message, args);
    }
    warn({ message, args }: WarnLogParams) {
      logger.warn(message, args);
    }
    error({ message, args, err }: ErrorLogParams) {
      logger.error(message, {
        ...args,
        error: err,
      });
    }
  }

  export const CLICKHOUSE_OPTIONS: NodeClickHouseClientConfigOptions = {
    max_open_connections: 30,
    request_timeout: 60000,
    keep_alive: {
      enabled: true,
      idle_socket_ttl: 8000,
    },
    compression: {
      request: true,
    },
    clickhouse_settings: {
      date_time_input_format: 'best_effort',
    },
    // log: {
    //   LoggerClass: CustomLogger,
    //   level: ClickHouseLogLevel.DEBUG,
    // },
  };

  export const clickHouseOG = createClient({
    url: process.env.CLICKHOUSE_URL || 
         (typeof globalThis.process !== 'undefined' ? globalThis.process.env?.CLICKHOUSE_URL : null) || 
         (typeof globalThis !== 'undefined' && 'CLICKHOUSE_URL' in globalThis ? (globalThis as Record<string, any>).CLICKHOUSE_URL : null),
    ...CLICKHOUSE_OPTIONS,
  });

  async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 500,
  ): Promise<T> {
    let lastError: Error | undefined;
  
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const res = await operation();
        if (attempt > 0) {
          logger.info('Retry operation succeeded', { attempt });
        }
        return res;
      } catch (error: any) {
        lastError = error;
  
        if (
          error.message.includes('Connect') ||
          error.message.includes('socket hang up') ||
          error.message.includes('Timeout error')
        ) {
          const delay = baseDelay * 2 ** attempt;
          logger.warn(
            `Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms`,
            {
              error: error.message,
            },
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
  
        throw error; // Non-retriable error
      }
    }
  
    throw lastError;
  }
  

  export const clickHouse = new Proxy(clickHouseOG, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
  
      if (property === 'insert') {
        return (...args: any[]) => withRetry(() => value.apply(target, args));
      }
  
      return value;
    },
  });

  const cleanQuery = (query?: string) =>
    typeof query === 'string'
      ? query.replace(/\n/g, "").replace(/\s+/g, " ").trim()
      : undefined;

  export async function chQueryWithMeta<T extends Record<string, any>>(
    query: string,
  ): Promise<ResponseJSON<T>> {
    const res = await clickHouse.query({
      query,
    });
    const json = await res.json<T>();
    const keys = Object.keys(json.data[0] || {});
    const response = {
      ...json,
      data: json.data.map((item) => {
        return keys.reduce((acc, key) => {
          const meta = json.meta?.find((m) => m.name === key);
          return Object.assign(acc, {
            [key]:
              item[key] && meta?.type.includes('Int')
                ? Number.parseFloat(item[key] as string)
                : item[key],
          });
        }, {} as T);
      }),
    };
  
    return response;
  }
  
  export async function chQuery<T extends Record<string, any>>(
    query: string,
  ): Promise<T[]> {
    return (await chQueryWithMeta<T>(query)).data;
  }
  
  export function formatClickhouseDate(
    date: Date | string,
    skipTime = false,
  ): string {
    if (skipTime) {
      return new Date(date).toISOString().split('T')[0] ?? '';
    }
    return new Date(date).toISOString().replace('T', ' ').replace(/Z+$/, '');
  }
  
  export function toDate(str: string, interval?: string) {
    // If it does not match the regex it's a column name eg 'created_at'
    if (!interval || interval === 'minute' || interval === 'hour') {
      if (str.match(/\d{4}-\d{2}-\d{2}/)) {
        return escape(str);
      }
  
      return str;
    }
  
    if (str.match(/\d{4}-\d{2}-\d{2}/)) {
      return `toDate(${escape(str.split(' ')[0])})`;
    }
  
    return `toDate(${str})`;
  }
  
  export function convertClickhouseDateToJs(date: string) {
    return new Date(`${date.replace(' ', 'T')}Z`);
  }