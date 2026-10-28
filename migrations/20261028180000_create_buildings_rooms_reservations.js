/**
 * Schemat: buildings 1—N rooms 1—N reservations.
 * ON DELETE RESTRICT: nie usuwamy budynku/sali, gdy istnieją zależne rekordy
 * (historia rezerwacji zostaje chroniona).
 */
export async function up(knex) {
    await knex.schema.createTable('buildings', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable().unique();
        table.string('address').notNullable();
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    });

    await knex.schema.createTable('rooms', (table) => {
        table.increments('id').primary();
        table
            .integer('building_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('buildings')
            .onDelete('RESTRICT');
        table.string('name').notNullable();
        table.integer('capacity').notNullable();
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

        table.unique(['building_id', 'name']);
        table.check('capacity > 0');
    });

    await knex.schema.createTable('reservations', (table) => {
        table.increments('id').primary();
        table
            .integer('room_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('rooms')
            .onDelete('RESTRICT');
        table.string('reserved_by').notNullable();
        table.integer('participants').notNullable();
        table.timestamp('start_time', { useTz: true }).notNullable();
        table.timestamp('end_time', { useTz: true }).notNullable();
        table.string('status').notNullable();
        table.timestamp('cancelled_at', { useTz: true }).nullable();
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

        table.check('end_time > start_time');
        table.check("status IN ('CONFIRMED', 'CANCELLED')");
    });

    // Indeks pod sprawdzanie kolizji: filtr po room_id + zakres czasu
    await knex.schema.raw(`
        CREATE INDEX reservations_room_id_start_end_idx
        ON reservations (room_id, start_time, end_time)
    `);
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('reservations');
    await knex.schema.dropTableIfExists('rooms');
    await knex.schema.dropTableIfExists('buildings');
}
