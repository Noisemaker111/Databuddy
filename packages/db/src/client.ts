import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../drizzle/schema';
import * as relations from '../drizzle/relations';

// Combine schema and relations
const fullSchema = { ...schema, ...relations };

export const db = drizzle(process.env.DATABASE_URL, { schema: fullSchema });