import { Elysia, t } from "elysia";
import { authMiddleware } from "../../middleware/auth";
import { websiteMiddleware } from "../../middleware/website";
import { timezoneMiddleware } from "../../middleware/timezone";
import type { WebsiteType } from "../../types";
import type { User } from "../../lib/auth";
import type { TimezoneInfo } from "../../lib/timezone";
import * as domainService from '../../services/domains.service';
import { CreateDomainType } from "../../types";

const domainsRouter = new Elysia({
    prefix: '/v1/domains'
})
    .use(authMiddleware())
    .use(websiteMiddleware({ required: true }))
    .use(timezoneMiddleware)
    .get('/', async ({ user }: { user: User }) => {
        return domainService.getDomains(user.id);
    })
    .get('/:id', async ({ params }) => {
        return domainService.getDomain(params.id);
    })
    .post('/', async ({ body }) => {
        return domainService.createDomain(body);
    }, {
        body: t.Object({
            name: t.String(),
            userId: t.String(),
            // Add other properties from CreateDomainType as needed
        })
    })
    .put('/:id', async ({ params, body }) => {
        return domainService.updateDomain(params.id, body);
    }, {
        body: t.Partial(t.Object({
            name: t.String(),
        }))
    })
    .delete('/:id', async ({ params }) => {
        return domainService.deleteDomain(params.id);
    });

export default domainsRouter;