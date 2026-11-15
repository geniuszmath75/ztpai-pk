const testDatabaseUrl =
    process.env.TEST_DATABASE_URL ??
    'postgres://roomuser:roompass@localhost:5432/room_booking_test';

const testDatabaseName = new URL(testDatabaseUrl).pathname.slice(1);
if (!/^[a-zA-Z0-9_]+$/.test(testDatabaseName) || !testDatabaseName.includes('test')) {
    throw new Error('TEST_DATABASE_URL must point to a test database');
}

process.env.TEST_DATABASE_URL = testDatabaseUrl;
process.env.DATABASE_URL = testDatabaseUrl;
process.env.STORAGE = 'knex';
process.env.JWT_SECRET =
    process.env.TEST_JWT_SECRET ?? 'integration-test-secret-at-least-32-characters';
process.env.JWT_EXPIRES_IN = '15m';
process.env.PORT = '3001';
