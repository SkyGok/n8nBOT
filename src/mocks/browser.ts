/**
 * MSW setup for browser environment
 * This initializes the mock service worker in development
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Create the MSW worker with our handlers
export const worker = setupWorker(...handlers);


