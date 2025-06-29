// /**
//  * SQL Builder Utility
//  * A utility class for building SQL queries in a structured way.
//  */

// interface SqlBuilderConfig {
//   table: string;
//   select: Record<string, string>;
//   where: Record<string, string>;
//   groupBy: Record<string, string>;
//   orderBy: Record<string, string>;
//   limit?: number;
// }

// export class SqlBuilder {
//   sb: SqlBuilderConfig;

//   constructor(config: SqlBuilderConfig) {
//     this.sb = config;
//   }

//   /**
//    * Set the table to query from
//    */
//   setTable(table: string): this {
//     this.sb.table = table;
//     return this;
//   }

//   /**
//    * Get the formatted SQL query
//    */
//   getSql(): string {
//     // Build SELECT clause
//     const selectItems = Object.values(this.sb.select);
//     const selectClause = selectItems.length > 0
//       ? `SELECT ${selectItems.join(', ')}`
//       : 'SELECT *';

//     // Build FROM clause
//     const fromClause = `FROM ${this.sb.table}`;

//     // Build WHERE clause
//     const whereItems = Object.values(this.sb.where);
//     const whereClause = whereItems.length > 0
//       ? `WHERE ${whereItems.join(' AND ')}`
//       : '';

//     // Build GROUP BY clause
//     const groupByItems = Object.values(this.sb.groupBy);
//     const groupByClause = groupByItems.length > 0
//       ? `GROUP BY ${groupByItems.join(', ')}`
//       : '';

//     // Build ORDER BY clause
//     const orderByItems = Object.values(this.sb.orderBy);
//     const orderByClause = orderByItems.length > 0
//       ? `ORDER BY ${orderByItems.join(', ')}`
//       : '';

//     // Build LIMIT clause
//     const limitClause = this.sb.limit !== undefined
//       ? `LIMIT ${this.sb.limit}`
//       : '';

//     // Combine all clauses
//     return [
//       selectClause,
//       fromClause,
//       whereClause,
//       groupByClause,
//       orderByClause,
//       limitClause
//     ].filter(clause => clause.length > 0).join('\n');
//   }
// }
