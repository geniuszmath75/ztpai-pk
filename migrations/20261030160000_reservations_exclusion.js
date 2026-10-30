/**
 * Exclusion constraint: brak nakładających się CONFIRMED na tej samej sali.
 * tstzrange(..., '[)') — stykanie (10–12 i 12–13) dozwolone; CANCELLED poza constraint.
 */
export async function up(knex) {
    await knex.raw('CREATE EXTENSION IF NOT EXISTS btree_gist');
    await knex.raw(`
        ALTER TABLE reservations
        ADD CONSTRAINT reservations_no_overlap_confirmed
        EXCLUDE USING gist (
            room_id WITH =,
            tstzrange(start_time, end_time, '[)') WITH &&
        )
        WHERE (status = 'CONFIRMED')
    `);
}

export async function down(knex) {
    await knex.raw(`
        ALTER TABLE reservations
        DROP CONSTRAINT IF EXISTS reservations_no_overlap_confirmed
    `);
}
