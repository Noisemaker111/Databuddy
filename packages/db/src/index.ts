export { db } from './client'
export * from './drizzle/schema'
export * from 'drizzle-orm'

export * from './drizzle/schema'
export * from './drizzle/relations'

// Clickhouse for backwards compatibility
export * from './clickhouse/client'
export * from './clickhouse/schema'
export { 
  clix, 
  clixTable, 
  tables, 
  columns,
  type TableMap,
  type TableName,
  type ColumnKeys,
  type ColumnValue,
  type Operator,
  Query as ClickHouseQuery
} from './clickhouse/query_builder'
