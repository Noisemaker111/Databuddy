import { Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import { basketRouter } from './routes/basket';
import type { AppVariables } from './types';

// Initialize logger
const logger = console;

// Create the main app
const app = new Hono<{ Variables: AppVariables }>();

// Add logging middleware
app.use('*', honoLogger());

// Health check route
app.get('/', (c) => c.json({ status: 'ok', version: '1.0.0' }));

// Mount the basket router
app.route('/basket', basketRouter);

// Error handling
app.onError((err, c) => {
  logger.error('Error:', err);
  return c.json({ 
    status: 'error', 
    message: err.message || 'Internal Server Error' 
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ 
    status: 'error', 
    message: 'Not Found' 
  }, 404);
});

// Export the app for Cloudflare Workers
export default {
  fetch: app.fetch,
  port: process.env.PORT || 4000,
};
  