import { clickHouse, clix, tables } from '@databuddy/db';
import type { User } from '@databuddy/auth';
import type { WebsiteType } from '../types';
import type { TimezoneInfo } from '../lib/timezone';
import { Elysia, t } from 'elysia';

type QueryContext = {
  user: User;
  website: WebsiteType;
  timezoneInfo: TimezoneInfo;
  body: {
    name: string;
    params?: Record<string, any>;
  };
};

// Define individual query functions
const queries = {
  'page-views': async (websiteId: string, params?: Record<string, any>) => {
    const query = tables
      .events(clickHouse)
      .select(['count() as count'], 'replace')
      .where('client_id', '=', websiteId)
      .where('event_name', '=', 'screen_view');
    return query.execute();
  },
  // ... other queries can be added here
};

export const executeQuery = async (context: QueryContext) => {
  const { website, body } = context;
  const { name, params } = body;

  if (!website?.id) {
    throw new Error('Website not found');
  }

  const queryFunction = queries[name as keyof typeof queries];

  if (!queryFunction) {
    throw new Error(`Query not found: ${name}`);
  }

  try {
    const results = await queryFunction(website.id, params);
    return {
      success: true,
      data: results,
    };
  } catch (error) {
    console.error(`Error executing query: ${name}`, {
      error,
      website_id: website.id,
    });
    throw new Error(`Error executing query: ${name}`);
  }
}; 