import 'dotenv/config';

/** @type {import('knex').Knex.Config} */
const config = {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
        directory: './migrations',
        tableName: 'knex_migrations'
    }
};

export default config;
