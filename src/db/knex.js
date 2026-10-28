import knex from 'knex';
import config from '../../knexfile.js';

function createKnex() {
    return knex(config);
}

export { createKnex };
