/**
 * Konta użytkowników: email UNIQUE (po normalizacji do małych liter w aplikacji),
 * password_hash (bcrypt), role z CHECK.
 */
export async function up(knex) {
    await knex.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('email').notNullable().unique();
        table.string('password_hash').notNullable();
        table.string('role').notNullable();
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

        table.check("role IN ('USER', 'ADMIN')");
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('users');
}
