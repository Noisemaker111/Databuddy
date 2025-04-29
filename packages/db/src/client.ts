import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../drizzle/schema';
import * as relations from '../drizzle/relations';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Combine schema and relations
const fullSchema = { ...schema, ...relations };

export const db = drizzle(connectionString, { schema: fullSchema });