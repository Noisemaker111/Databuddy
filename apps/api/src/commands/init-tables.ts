#!/usr/bin/env node
/**
 * ClickHouse Tables Initialization Command
 * 
 * This command initializes all ClickHouse tables required for the analytics system.
 * 
 * Usage:
 * bun run src/commands/init-tables.ts
 */

import initClickhouseTables from '../scripts/init-clickhouse-tables';

async function run() {
  console.info('Initializing ClickHouse tables...');
  
  try {
    const result = await initClickhouseTables();
    
    if (result.success) {
      console.info(result.message);
      process.exit(0);
    } else {
      console.error(result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('Unhandled error during initialization:', error);
    process.exit(1);
  }
}

run(); 