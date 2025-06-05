import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './drizzle/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
  extensionsFilters: ['postgis'],
  tablesFilter: ['!pg_stat_*'],
  schemaFilter: ['public', 'analytics'],
}); 