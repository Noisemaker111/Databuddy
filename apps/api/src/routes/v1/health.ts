import { Hono } from "hono";
import type { AppVariables } from "../../types";
import { chQuery, db } from "@databuddy/db";
import { redis } from "@databuddy/redis";

export const healthRouter = new Hono<{ Variables: AppVariables }>();

const checkClickhouse = async () => {
    const result = await chQuery("SELECT 1 FROM analytics.events LIMIT 1");
    return result.length > 0;
};

const checkDatabase = async () => {
    const result = await db.query.websites.findMany({
        limit: 1,
    });
    return result.length > 0;
};

const checkRedis = async () => {
    const result = await redis.ping();
    if (result !== "PONG") {
        return false;
    }
    return true;
};

healthRouter.get("/", async (c) => {

    const [clickhouse, database, redis] = await Promise.all([
        checkClickhouse(),
        checkDatabase(),
        checkRedis()
    ]);

    const success = clickhouse && database && redis; // otherwise, degraded

    return c.json({ clickhouse, database, redis, success, version: "1.0.0" }, success ? 200 : 503);
});

