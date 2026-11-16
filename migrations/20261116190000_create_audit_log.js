export async function up(knex) {
    await knex.schema.createTable('audit_log', (table) => {
        table.increments('id').primary();
        table.string('event_type').notNullable().index();
        table.jsonb('payload').notNullable();
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('audit_log');
}
