import { Elysia, t } from 'elysia';
import { authMiddleware } from '../../middleware/auth';
import { websiteMiddleware } from '../../middleware/website';
import { timezoneMiddleware } from '../../middleware/timezone';
import { executeQuery } from '../../controllers/query.controller';

const queryRouter = new Elysia({
  prefix: '/v1/query',
})
  .use(authMiddleware())
  .use(websiteMiddleware({ required: true }))
  .use(timezoneMiddleware)
  .post(
    '/',
    (context) => {
      return executeQuery(context);
    },
    {
      body: t.Object({
        name: t.String(),
        params: t.Optional(t.Object({}, { additionalProperties: true })),
      }),
    }
  );

export default queryRouter; 