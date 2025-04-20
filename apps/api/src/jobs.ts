// /**
//  * Jobs Management
//  * 
//  * This file contains the startup and shutdown logic for queue workers.
//  */

// import { createLogger } from '@databuddy/logger';
// import { initEventQueueWorker, closeAll, type EventJobData } from '@databuddy/queue';
// // import { processEvent } from './controllers/analytics.controller';

// // Initialize logger
// const logger = createLogger('api:jobs');

// // Store worker reference
// let eventsWorker: any = null;

// /**
//  * Initialize all workers
//  */
// export async function initializeWorkers(concurrency = 5) {
//   logger.info('Initializing queue workers...');
  
//   try {
//     // Start the event queue worker
//     eventsWorker = await initEventQueueWorker(concurrency);
//     logger.info(`Event queue worker initialized with concurrency ${concurrency}`);
//     return true;
//   } catch (error) {
//     logger.error('Failed to initialize queue workers', { error });
//     return false;
//   }
// }

// /**
//  * Process an event
//  */
// export async function processEvent(event: EventJobData) {
//   await processEvent(event);
// }

// /**
//  * Shutdown all workers
//  */
// export async function shutdownWorkers() {
//   logger.info('Shutting down queue workers...');
  
//   try {
//     // Close all queue connections
//     await closeAll();
//     logger.info('Queue workers shutdown successfully');
//     return true;
//   } catch (error) {
//     logger.error('Error shutting down queue workers', { error });
//     return false;
//   }
// } 