import { z } from "zod";

export const FilterOperators = {
    eq: '=',
    ne: '!=',
    like: 'LIKE',
    gt: '>',
    lt: '<',
    in: 'IN',
    notIn: 'NOT IN'
} as const;

export const TimeGranularity = {
    minute: 'toStartOfMinute',
    hour: 'toStartOfHour',
    day: 'toStartOfDay',
    week: 'toStartOfWeek',
    month: 'toStartOfMonth'
} as const;

export type FilterOperator = keyof typeof FilterOperators;
export type TimeUnit = keyof typeof TimeGranularity | 'hourly' | 'daily';

export interface Filter {
    field: string;
    op: FilterOperator;
    value: string | number | (string | number)[];
}

export interface SimpleQueryConfig {
    table?: string;
    fields?: string[];
    where?: string[];
    groupBy?: string[];
    orderBy?: string;
    limit?: number;
    timeField?: string;
    allowedFilters?: string[];
    customizable?: boolean;
    plugins?: {
        parseReferrers?: boolean;
        normalizeUrls?: boolean;
        [key: string]: any;
    };
    customSql?: (
        websiteId: string,
        startDate: string,
        endDate: string,
        filters?: Filter[],
        granularity?: TimeUnit,
        limit?: number,
        offset?: number
    ) => string | { sql: string; params: Record<string, unknown> };
}

export interface QueryRequest {
    projectId: string;
    type: string;
    from: string;
    to: string;
    timeUnit?: TimeUnit;
    filters?: Filter[];
    groupBy?: string[];
    orderBy?: string;
    limit?: number;
    offset?: number;
}

export interface CompiledQuery {
    sql: string;
    params: Record<string, unknown>;
} 