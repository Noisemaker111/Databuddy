import "./polyfills/compression";
import { auth } from "@databuddy/auth";
import {
	appRouter,
	createAbortSignalInterceptor,
	createRPCContext,
	setupUncaughtErrorHandlers,
} from "@databuddy/rpc";
import { logger } from "@databuddy/shared/logger";
import cors from "@elysiajs/cors";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { autumnHandler } from "autumn-js/elysia";
import { Elysia } from "elysia";
import {
	endRequestSpan,
	initTracing,
	shutdownTracing,
	startRequestSpan,
} from "./lib/tracing";
import { assistant } from "./routes/assistant";
// import { customSQL } from './routes/custom-sql';
import { exportRoute } from "./routes/export";
import { health } from "./routes/health";
import { publicApi } from "./routes/public";
import { query } from "./routes/query";

initTracing();
setupUncaughtErrorHandlers();

const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [
		createAbortSignalInterceptor(),
		onError((error) => {
			logger.error(error);
		}),
	],
});

const app = new Elysia()
	.state("tracing", {
		span: null as ReturnType<typeof startRequestSpan> | null,
		startTime: 0,
	})
	.use(publicApi)
	.use(
		cors({
			credentials: true,
			origin: [
				/(?:^|\.)databuddy\.cc$/,
				...(process.env.NODE_ENV === "development"
					? ["http://localhost:3000"]
					: []),
			],
		})
	)
	.use(health)
	.onBeforeHandle(function startTrace({ request, path, store }) {
		const method = request.method;
		const startTime = Date.now();
		const span = startRequestSpan(method, request.url, path);

		// Store span and start time in Elysia store
		store.tracing = {
			span,
			startTime,
		};
	})
	.onAfterHandle(function endTrace({ response, store }) {
		if (store.tracing?.span && store.tracing.startTime) {
			const statusCode = response instanceof Response ? response.status : 200;
			endRequestSpan(store.tracing.span, statusCode, store.tracing.startTime);
		}
	})
	.use(
		autumnHandler({
			identify: async ({ request }) => {
				try {
					const session = await auth.api.getSession({
						headers: request.headers,
					});

					return {
						customerId: session?.user.id ?? undefined,
						customerData: {
							name: session?.user.name ?? undefined,
							email: session?.user.email ?? undefined,
						},
					};
				} catch (error) {
					logger.error({ error }, "Failed to get session for autumn handler");
					return null;
				}
			},
		})
	)
	.use(query)
	.use(assistant)
	.use(exportRoute)
	.all(
		"/rpc/*",
		async ({ request }: { request: Request }) => {
			try {
				const context = await createRPCContext({ headers: request.headers });
				const { response } = await rpcHandler.handle(request, {
					prefix: "/rpc",
					context,
				});
				return response ?? new Response("Not Found", { status: 404 });
			} catch (error) {
				logger.error({ error }, "RPC handler failed");
				return new Response("Internal Server Error", { status: 500 });
			}
		},
		{
			parse: "none",
		}
	)
	.onError(function handleError({ error, code, store }) {
		if (store.tracing?.span && store.tracing.startTime) {
			const statusCode = code === "NOT_FOUND" ? 404 : 500;
			endRequestSpan(store.tracing.span, statusCode, store.tracing.startTime);
		}

		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error({ error, code }, errorMessage);

		return new Response(
			JSON.stringify({
				success: false,
				error: errorMessage,
				code: code ?? "INTERNAL_SERVER_ERROR",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	});

export default {
	fetch: app.fetch,
	port: 3001,
};

process.on("SIGINT", async () => {
	logger.info("SIGINT received, shutting down gracefully...");
	await shutdownTracing().catch((error) =>
		logger.error({ error }, "Shutdown error")
	);
	process.exit(0);
});

process.on("SIGTERM", async () => {
	logger.info("SIGTERM received, shutting down gracefully...");
	await shutdownTracing().catch((error) =>
		logger.error({ error }, "Shutdown error")
	);
	process.exit(0);
});
