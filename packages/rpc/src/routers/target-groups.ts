import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull, targetGroups } from "@databuddy/db";
import { createDrizzleCache, redis } from "@databuddy/redis";
import { userRuleSchema } from "@databuddy/shared/flags";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../orpc";
import { authorizeWebsiteAccess } from "../utils/auth";

const targetGroupsCache = createDrizzleCache({
    redis,
    namespace: "targetGroups",
});
const CACHE_DURATION = 60;

const listSchema = z.object({
    websiteId: z.string(),
});

const getByIdSchema = z.object({
    id: z.string(),
    websiteId: z.string(),
});

const createSchema = z.object({
    websiteId: z.string(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    rules: z.array(userRuleSchema),
});

const updateSchema = z.object({
    id: z.string(),
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
    rules: z.array(userRuleSchema).optional(),
});

const deleteSchema = z.object({
    id: z.string(),
});

export const targetGroupsRouter = {
    list: protectedProcedure.input(listSchema).handler(({ context, input }) => {
        const cacheKey = `list:website:${input.websiteId}`;

        return targetGroupsCache.withCache({
            key: cacheKey,
            ttl: CACHE_DURATION,
            tables: ["target_groups"],
            queryFn: async () => {
                await authorizeWebsiteAccess(context, input.websiteId, "read");

                return context.db
                    .select()
                    .from(targetGroups)
                    .where(
                        and(
                            eq(targetGroups.websiteId, input.websiteId),
                            isNull(targetGroups.deletedAt)
                        )
                    )
                    .orderBy(desc(targetGroups.createdAt));
            },
        });
    }),

    getById: protectedProcedure
        .input(getByIdSchema)
        .handler(async ({ context, input }) => {
            await authorizeWebsiteAccess(context, input.websiteId, "read");

            const cacheKey = `byId:${input.id}:website:${input.websiteId}`;

            return targetGroupsCache.withCache({
                key: cacheKey,
                ttl: CACHE_DURATION,
                tables: ["target_groups"],
                queryFn: async () => {
                    const result = await context.db
                        .select()
                        .from(targetGroups)
                        .where(
                            and(
                                eq(targetGroups.id, input.id),
                                eq(targetGroups.websiteId, input.websiteId),
                                isNull(targetGroups.deletedAt)
                            )
                        )
                        .limit(1);

                    if (result.length === 0) {
                        throw new ORPCError("NOT_FOUND", {
                            message: "Target group not found",
                        });
                    }

                    return result[0];
                },
            });
        }),

    create: protectedProcedure
        .input(createSchema)
        .handler(async ({ context, input }) => {
            await authorizeWebsiteAccess(context, input.websiteId, "update");

            const [newGroup] = await context.db
                .insert(targetGroups)
                .values({
                    id: randomUUID(),
                    name: input.name,
                    description: input.description ?? null,
                    color: input.color,
                    rules: input.rules,
                    websiteId: input.websiteId,
                    createdBy: context.user.id,
                })
                .returning();

            await targetGroupsCache.invalidateByTables(["target_groups"]);

            return newGroup;
        }),

    update: protectedProcedure
        .input(updateSchema)
        .handler(async ({ context, input }) => {
            const existingGroup = await context.db
                .select()
                .from(targetGroups)
                .where(
                    and(eq(targetGroups.id, input.id), isNull(targetGroups.deletedAt))
                )
                .limit(1);

            if (existingGroup.length === 0) {
                throw new ORPCError("NOT_FOUND", {
                    message: "Target group not found",
                });
            }

            const group = existingGroup[0];

            await authorizeWebsiteAccess(context, group.websiteId, "update");

            const { id, ...updates } = input;
            const [updatedGroup] = await context.db
                .update(targetGroups)
                .set({
                    ...updates,
                    updatedAt: new Date(),
                })
                .where(
                    and(eq(targetGroups.id, id), isNull(targetGroups.deletedAt))
                )
                .returning();

            await targetGroupsCache.invalidateByTables(["target_groups"]);

            return updatedGroup;
        }),

    delete: protectedProcedure
        .input(deleteSchema)
        .handler(async ({ context, input }) => {
            const existingGroup = await context.db
                .select()
                .from(targetGroups)
                .where(
                    and(
                        eq(targetGroups.id, input.id),
                        isNull(targetGroups.deletedAt)
                    )
                )
                .limit(1);

            if (existingGroup.length === 0) {
                throw new ORPCError("NOT_FOUND", {
                    message: "Target group not found",
                });
            }

            const group = existingGroup[0];

            await authorizeWebsiteAccess(context, group.websiteId, "delete");

            await context.db
                .update(targetGroups)
                .set({
                    deletedAt: new Date(),
                })
                .where(
                    and(eq(targetGroups.id, input.id), isNull(targetGroups.deletedAt))
                );

            await targetGroupsCache.invalidateByTables(["target_groups"]);

            return { success: true };
        }),
};

