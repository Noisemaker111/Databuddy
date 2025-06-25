import { Hono } from 'hono'

import { authMiddleware } from '../../middleware/auth'
import { websiteAuthHook } from '../../middleware/website'
import { timezoneMiddleware } from '../../middleware/timezone'
import { logger } from '../../lib/logger'
import {
  PARAMETER_BUILDERS,
  PARAMETER_CATEGORIES,
  executeBatchQueries,
  type AnalyticsContext
} from '../../query'

export const queryRouter = new Hono<AnalyticsContext>()

queryRouter.use('*', authMiddleware)
queryRouter.use('*', websiteAuthHook({ website: ["read"] }))
queryRouter.use('*', timezoneMiddleware)

queryRouter.post(
  '/',
  async (c) => {
    const requestData = await c.req.json()
    const website = c.get('website')

    try {
      if (!website?.id) {
        return c.json({ success: false, error: 'Invalid website access' }, 403)
      }

      const queries = Array.isArray(requestData) ? requestData : [requestData]

      const queriesWithIds = queries.map((query, index) => ({
        ...query,
        id: query.id || `query_${index}`
      }))

      const results = await executeBatchQueries(queriesWithIds, website.id, website.domain)

      if (!Array.isArray(requestData)) {
        return c.json(results[0])
      }

      return c.json({
        success: true,
        batch: true,
        results: results,
        meta: {
          total_queries: queries.length,
          successful_queries: results.filter(r => r.success).length,
          failed_queries: results.filter(r => !r.success).length
        }
      })

    } catch (error: any) {
      logger.error('Batch query failed', {
        error: error.message,
        website_id: website.id,
        queries_count: Array.isArray(requestData) ? requestData.length : 1
      })

      return c.json({
        success: false,
        error: 'Query processing failed'
      }, 500)
    }
  }
)

// Get available parameters
queryRouter.get('/parameters', async (c) => {
  return c.json({
    success: true,
    parameters: Object.keys(PARAMETER_BUILDERS),
    categories: PARAMETER_CATEGORIES
  })
})

export default queryRouter 