/**
 * Migration script to update the analytics.events table schema
 * 
 * This script adds new columns to the existing analytics.events table
 * to better store the data collected by the enhanced databuddy.js client.
 */

import { clickHouse } from '@databuddy/db';

const logger = console;

async function migrateEventsSchema() {
  try {
    logger.info('Starting migration of analytics.events table schema');
    logger.info('-----------------------------------------------');
    
    // Define the new columns to add - we'll add them all without validation
    logger.info('Preparing columns to add');
    const newColumns = [
      // User Agent parsing fields
      { name: 'browser_name', type: 'Nullable(String)', defaultValue: 'NULL' },
      { name: 'browser_version', type: 'Nullable(String)', defaultValue: 'NULL' },
      { name: 'os_name', type: 'Nullable(String)', defaultValue: 'NULL' },
      { name: 'os_version', type: 'Nullable(String)', defaultValue: 'NULL' },
      { name: 'device_type', type: 'Nullable(String)', defaultValue: 'NULL' },
      { name: 'device_brand', type: 'Nullable(String)', defaultValue: 'NULL' },
      { name: 'device_model', type: 'Nullable(String)', defaultValue: 'NULL' },
      // Existing columns

    ];
    logger.info(`Will attempt to add ${newColumns.length} columns one by one`);
    
    // Add columns one by one
    let successCount = 0;
    let errorCount = 0;
    
    for (const column of newColumns) {
      logger.info(`Adding column ${column.name} (${column.type})...`);
      
      // Create single column ALTER TABLE query
      const alterQuery = `
        ALTER TABLE analytics.events
        ADD COLUMN IF NOT EXISTS ${column.name} ${column.type} DEFAULT ${column.defaultValue}
      `;
      
      try {
        await clickHouse.command({
          query: alterQuery,
          clickhouse_settings: {
            receive_timeout: 30,
            send_timeout: 30,
            connect_timeout: 30
          }
        });
        
        logger.info(`✓ Successfully added column ${column.name}`);
        successCount++;
      } catch (error) {
        logger.error(`Failed to add column ${column.name}: ${error instanceof Error ? error.message : String(error)}`);
        errorCount++;
        // Continue with next column
      }
    }
    
    // Add a migration to update the device_stats table
    logger.info('Updating device_stats table schema...');
    const deviceStatsColumns = [
      { name: 'browser_name', type: 'String', defaultValue: '\'\'' },
      { name: 'browser_version', type: 'String', defaultValue: '\'\'' },
      { name: 'os_name', type: 'String', defaultValue: '\'\'' },
      { name: 'os_version', type: 'String', defaultValue: '\'\'' },
      { name: 'device_brand', type: 'String', defaultValue: '\'\'' },
      { name: 'device_model', type: 'String', defaultValue: '\'\'' }
    ];

    for (const column of deviceStatsColumns) {
      logger.info(`Adding column ${column.name} to device_stats (${column.type})...`);
      
      const alterQuery = `
        ALTER TABLE analytics.device_stats
        ADD COLUMN IF NOT EXISTS ${column.name} ${column.type} DEFAULT ${column.defaultValue}
      `;
      
      try {
        await clickHouse.command({
          query: alterQuery,
          clickhouse_settings: {
            receive_timeout: 30,
            send_timeout: 30,
            connect_timeout: 30
          }
        });
        
        logger.info(`✓ Successfully added column ${column.name} to device_stats`);
        successCount++;
      } catch (error) {
        logger.error(`Failed to add column ${column.name} to device_stats: ${error instanceof Error ? error.message : String(error)}`);
        errorCount++;
      }
    }

    // Update the ORDER BY clause for device_stats
    try {
      const alterOrderBy = `
        ALTER TABLE analytics.device_stats
        MODIFY ORDER BY (client_id, date, browser_name, os_name, device_type)
      `;
      
      await clickHouse.command({
        query: alterOrderBy,
        clickhouse_settings: {
          receive_timeout: 30,
          send_timeout: 30,
          connect_timeout: 30
        }
      });
      
      logger.info('✓ Successfully updated device_stats ORDER BY clause');
      successCount++;
    } catch (error) {
      logger.error(`Failed to update device_stats ORDER BY clause: ${error instanceof Error ? error.message : String(error)}`);
      errorCount++;
    }
    
    logger.info('-----------------------------------------------');
    logger.info(`Migration completed: ${successCount} columns added, ${errorCount} failures`);
    
    return {
      success: true,
      message: `Schema migration completed with ${successCount} columns added and ${errorCount} failures`
    };
  } catch (error) {
    logger.error('-----------------------------------------------');
    logger.error('Error during migration:', error);
    return {
      success: false,
      message: 'Migration failed',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Execute the migration if this script is run directly
if (require.main === module) {
  migrateEventsSchema()
    .then(result => {
      if (result.success) {
        logger.info(result.message);
        process.exit(0);
      } else {
        logger.error(result.message);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error during migration:', error);
      process.exit(1);
    });
}

export default migrateEventsSchema; 