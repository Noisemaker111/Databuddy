import { Elysia } from 'elysia'
import basketRouter from './routes/basket';
import { logger } from './lib/logger';

export default new Elysia()
  .onError(({ error }) => {
    logger.error(new Error(`${error instanceof Error ? error.name : 'Unknown'}: ${error instanceof Error ? error.message : 'Unknown'}`));
  })
  .onBeforeHandle(({ request, set }) => {
    const origin = request.headers.get('origin')
    if (origin) {
      set.headers ??= {}
      set.headers['Access-Control-Allow-Origin'] = origin
      set.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS, PUT, DELETE'
      set.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, databuddy-client-id, databuddy-sdk-name, databuddy-sdk-version'
      set.headers['Access-Control-Allow-Credentials'] = 'true'
    }
  })
  .options('*', () => new Response(null, { status: 204 }))
  .use(basketRouter)
  .get('/health', () => ({ status: 'ok', version: '1.0.0' }))
  .listen(process.env.PORT || 4001)
