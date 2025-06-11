# Build stage
FROM oven/bun:1-slim AS builder


# Copy dependency files
COPY ./ /app
WORKDIR /app

# Install dependencies
RUN bun install 
RUN bun run build

# Production stage
FROM oven/bun:1-slim



# Copy built files from builder
COPY --from=builder /app /app
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    BUN_ENV=production

# Expose port
EXPOSE 3000
# Start API
CMD ["bun", "run", "start"]