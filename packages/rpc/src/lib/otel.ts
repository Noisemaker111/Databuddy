import { SpanStatusCode, trace } from "@opentelemetry/api";
import { ORPCInstrumentation } from "@orpc/otel";

/**
 * Create ORPCInstrumentation instance for OpenTelemetry integration
 */
export function createORPCInstrumentation(): ORPCInstrumentation {
    return new ORPCInstrumentation();
}

/**
 * Record uncaught errors in OpenTelemetry spans
 */
export function recordError(eventName: string, reason: unknown): void {
    const tracer = trace.getTracer("uncaught-errors");
    const span = tracer.startSpan(eventName);
    const message = String(reason);

    if (reason instanceof Error) {
        span.recordException(reason);
    } else {
        span.recordException({ message });
    }

    span.setStatus({ code: SpanStatusCode.ERROR, message });
    span.end();
}

/**
 * Setup uncaught exception handlers with OpenTelemetry
 */
export function setupUncaughtErrorHandlers(): void {
    process.on("uncaughtException", (reason) => {
        recordError("uncaughtException", reason);
    });

    process.on("unhandledRejection", (reason) => {
        recordError("unhandledRejection", reason);
    });
}

/**
 * Create an interceptor to capture abort signals in OpenTelemetry spans
 */
export function createAbortSignalInterceptor<T = unknown>() {
    return ({ request, next }: { request: { signal?: AbortSignal }; next: () => T }) => {
        const span = trace.getActiveSpan();

        request.signal?.addEventListener("abort", () => {
            span?.addEvent("aborted", { reason: String(request.signal?.reason) });
        });

        return next();
    };
}



