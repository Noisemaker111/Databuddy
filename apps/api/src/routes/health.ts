import { Elysia } from "elysia";
import { chQuery, db } from "@databuddy/db";
import { redis } from "@databuddy/redis";

interface HealthCheckResult {
    status: boolean;
    responseTime: number;
    error?: string;
}

interface HealthStatus {
    clickhouse: HealthCheckResult;
    database: HealthCheckResult;
    redis: HealthCheckResult;
    memory: HealthCheckResult;
    success: boolean;
    version: string;
    timestamp: string;
    uptime: number;
    environment: string;
    totalResponseTime: number;
}

const measureResponseTime = async <T>(fn: () => Promise<T>): Promise<{ result: T; responseTime: number }> => {
    const start = Date.now();
    const result = await fn();
    const responseTime = Date.now() - start;
    return { result, responseTime };
};

const checkClickhouse = async (): Promise<HealthCheckResult> => {
    try {
        const { result, responseTime } = await measureResponseTime(async () => {
            return await chQuery("SELECT 1 FROM analytics.events LIMIT 1");
        });

        return {
            status: result.length > 0,
            responseTime,
        };
    } catch (error) {
        console.error("ClickHouse health check failed:", error);
        return {
            status: false,
            responseTime: 0,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
};

const checkDatabase = async (): Promise<HealthCheckResult> => {
    try {
        const { result, responseTime } = await measureResponseTime(async () => {
            return await db.query.websites.findMany({
                limit: 1,
            });
        });

        return {
            status: result.length > 0,
            responseTime,
        };
    } catch (error) {
        console.error("Database health check failed:", error);
        return {
            status: false,
            responseTime: 0,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
};

const checkRedis = async (): Promise<HealthCheckResult> => {
    try {
        const { result, responseTime } = await measureResponseTime(async () => {
            return await redis.ping();
        });

        return {
            status: result === "PONG",
            responseTime,
        };
    } catch (error) {
        console.error("Redis health check failed:", error);
        return {
            status: false,
            responseTime: 0,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
};

const checkMemoryUsage = (): HealthCheckResult => {
    const memUsage = process.memoryUsage();
    const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const memoryUsagePercent = (usedMB / totalMB) * 100;

    const isHealthy = memoryUsagePercent < 90;

    return {
        status: isHealthy,
        responseTime: 0,
        error: isHealthy ? undefined : `High memory usage: ${memoryUsagePercent.toFixed(1)}%`
    };
};

export const health = new Elysia({ prefix: '/health' })
    .get('/', async () => {
        const startTime = Date.now();

        const [clickhouse, database, redis, memory] = await Promise.all([
            checkClickhouse(),
            checkDatabase(),
            checkRedis(),
            Promise.resolve(checkMemoryUsage())
        ]);

        const success = clickhouse.status && database.status && redis.status && memory.status;
        const status = success ? 200 : 503;
        const totalResponseTime = Date.now() - startTime;

        const healthStatus: HealthStatus = {
            clickhouse,
            database,
            redis,
            memory,
            success,
            version: process.env.npm_package_version || "1.0.0",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || "development",
            totalResponseTime
        };

        return new Response(JSON.stringify(healthStatus, null, 2), {
            status,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    })
    .get('/ready', async () => {
        const [clickhouse, database, redis] = await Promise.all([
            checkClickhouse(),
            checkDatabase(),
            checkRedis()
        ]);

        const isReady = clickhouse.status && database.status && redis.status;

        return new Response(JSON.stringify({
            ready: isReady,
            timestamp: new Date().toISOString()
        }), {
            status: isReady ? 200 : 503,
            headers: { 'Content-Type': 'application/json' }
        });
    })
    .get('/live', async () => {
        return new Response(JSON.stringify({
            alive: true,
            timestamp: new Date().toISOString()
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }); 