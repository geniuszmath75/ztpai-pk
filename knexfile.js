import { config } from './src/config/index.js';

/** @type {import('knex').Knex.Config} */
const knexConfig = {
    client: 'pg',
    connection: config.databaseUrl,
    migrations: {
        directory: './migrations',
        tableName: 'knex_migrations'
    },
    seeds: {
        directory: './seeds'
    }
};

export default knexConfig;
