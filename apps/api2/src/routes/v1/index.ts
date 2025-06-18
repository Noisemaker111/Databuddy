import { Elysia } from 'elysia';
import domainsRouter from './domains';
import queryRouter from './query';

const v1Router = new Elysia({
  prefix: '/v1',
})
  .use(domainsRouter)
  .use(queryRouter);

export default v1Router;
