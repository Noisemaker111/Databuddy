import type { ParameterBuilder } from '../types'
import { escapeSqlString } from '../utils'

export const revenueBuilders: Record<string, ParameterBuilder> = {
  revenue_summary: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      SUM(amount) / 100 as total_revenue,
      COUNT(*) as total_transactions,
      COUNT(DISTINCT CASE WHEN status = 'succeeded' THEN id END) as successful_transactions,
      (SELECT COUNT(*) FROM analytics.stripe_refunds 
         WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
         AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})) as total_refunds,
      AVG(amount) / 100 as avg_order_value,
      (COUNT(DISTINCT CASE WHEN status = 'succeeded' THEN id END) * 100.0 / COUNT(*)) as success_rate
    FROM analytics.stripe_payment_intents 
    WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
  `,

  revenue_trends: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => {
    const timeFormat = granularity === 'hourly' 
      ? 'toDateTime(toStartOfHour(toDateTime(created)))' 
      : 'toDate(toDateTime(created))';
    
    return `
      SELECT 
        ${timeFormat} as time,
        SUM(amount) / 100 as total_revenue,
        COUNT(*) as total_transactions,
        AVG(amount) / 100 as avg_order_value,
        (COUNT(DISTINCT CASE WHEN status = 'succeeded' THEN id END) * 100.0 / COUNT(*)) as success_rate
      FROM analytics.stripe_payment_intents 
      WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
        AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      GROUP BY time 
      ORDER BY time DESC 
      LIMIT ${offset}, ${limit}
    `;
  },

  recent_transactions: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      id,
      toDateTime(created) as created,
      status,
      currency,
      amount / 100 as amount,
      customer_id,
      anonymized_user_id as session_id
    FROM analytics.stripe_payment_intents 
    WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
    ORDER BY created DESC 
    LIMIT ${offset}, ${limit}
  `,

  recent_refunds: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      id,
      toDateTime(created) as created,
      status,
      reason,
      currency,
      amount / 100 as amount,
      payment_intent_id,
      anonymized_user_id as session_id
    FROM analytics.stripe_refunds 
    WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
    ORDER BY created DESC 
    LIMIT ${offset}, ${limit}
  `,

  revenue_by_country: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      e.country as name,
      SUM(pi.amount) / 100 as total_revenue,
      COUNT(pi.id) as total_transactions,
      AVG(pi.amount) / 100 as avg_order_value
    FROM analytics.stripe_payment_intents pi
    LEFT JOIN analytics.events e ON pi.anonymized_user_id = e.session_id
    WHERE pi.created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND pi.created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND pi.status = 'succeeded'
      AND e.country IS NOT NULL 
      AND e.country != ''
    GROUP BY e.country 
    ORDER BY total_revenue DESC 
    LIMIT ${offset}, ${limit}
  `,

  revenue_by_currency: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      currency as name,
      SUM(amount) / 100 as total_revenue,
      COUNT(*) as total_transactions,
      AVG(amount) / 100 as avg_order_value
    FROM analytics.stripe_payment_intents 
    WHERE created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND status = 'succeeded'
    GROUP BY currency 
    ORDER BY total_revenue DESC 
    LIMIT ${offset}, ${limit}
  `,

  revenue_by_card_brand: (websiteId: string, startDate: string, endDate: string, limit: number, offset: number, granularity: 'hourly' | 'daily' = 'daily') => `
    SELECT 
      c.card_brand as name,
      SUM(pi.amount) / 100 as total_revenue,
      COUNT(pi.id) as total_transactions,
      AVG(pi.amount) / 100 as avg_order_value
    FROM analytics.stripe_payment_intents pi
    LEFT JOIN analytics.stripe_charges c ON pi.id = c.payment_intent_id
    WHERE pi.created >= parseDateTimeBestEffort(${escapeSqlString(startDate)})
      AND pi.created <= parseDateTimeBestEffort(${escapeSqlString(endDate)})
      AND pi.status = 'succeeded'
      AND c.card_brand IS NOT NULL 
      AND c.card_brand != ''
    GROUP BY c.card_brand 
    ORDER BY total_revenue DESC 
    LIMIT ${offset}, ${limit}
  `,
} 