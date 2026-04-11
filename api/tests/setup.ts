import dotenv from 'dotenv';
import path from 'path';

/**
 * Jest Setup File
 * Runs once before all tests, before test framework is initialized
 * Loads environment variables from .env.test for test environment
 */

// Load .env.test for test environment
const envFilePath = path.resolve(__dirname, '../.env.test');
const result = dotenv.config({ path: envFilePath });

if (result.error) {
  console.warn(`Warning: Could not load .env.test: ${result.error.message}`);
}

console.log(`✓ Test environment loaded (NODE_ENV=${process.env.NODE_ENV})`);
console.log(`✓ Redis URL: ${process.env.REDIS_URL}`);

// Set test-specific environment variables
process.env.NODE_ENV = 'test';

// Suppress some logs during tests
if (process.env.LOG_LEVEL !== 'debug') {
  globalThis.console = {
    ...console,
    // Keep error and warn during tests for debugging
    log: jest.fn(),
    info: jest.fn(),
  };
}
