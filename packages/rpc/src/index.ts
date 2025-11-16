/** biome-ignore-all lint/performance/noBarrelFile: we need to export these functions */
export {
    createAbortSignalInterceptor,
    createORPCInstrumentation,
    recordError,
    setupUncaughtErrorHandlers,
} from "./lib/otel";
export { createRPCContext } from "./orpc";
export { type AppRouter, appRouter } from "./root";
