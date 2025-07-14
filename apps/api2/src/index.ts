import { Elysia } from "elysia";
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createTRPCContext } from '@databuddy/rpc';
import { query } from "./routes/query";

import cors from '@elysiajs/cors';

const app = new Elysia();

app.get('/', () => {
  return 'Hello World';
})
  .use(cors({
    credentials: true,
    origin: "https://staging.databuddy.cc"
  }))
  .onRequest(({ set, request }) => {
    set.headers.Vary = 'Origin, Access-Control-Request-Headers';
    set.headers['Access-Control-Allow-Origin'] = 'https://staging.databuddy.cc';
  })
  .use(query)
  .options('/trpc/*', ({ set }) => {
    set.status = 204;
    set.headers['Access-Control-Allow-Origin'] = 'https://staging.databuddy.cc';
    set.headers['Access-Control-Allow-Credentials'] = 'true';
    set.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    set.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Cookie, Cache-Control, X-Website-Id';
    set.headers.Vary = 'Origin, Access-Control-Request-Headers';
    return null; // Let Elysia build the response
  })
  .all('/trpc/*', async ({ request, set }) => {
    const response = await fetchRequestHandler({
      endpoint: '/trpc',
      router: appRouter,
      req: request,
      createContext: () => createTRPCContext({ headers: request.headers }),
    });

    // Add CORS headers to tRPC response
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', 'https://staging.databuddy.cc');
    newHeaders.set('Access-Control-Allow-Credentials', 'true');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, Cache-Control, X-Website-Id');
    newHeaders.set('Vary', 'Origin, Access-Control-Request-Headers');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  });

app.listen(3001)
  .onStart(() => {
    console.log('Server is running on port 3001');
  });

app.onError(({ error, code }) => {
  console.error(error);
  return {
    success: false,
    code: code
  };
});