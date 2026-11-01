import bcrypt from 'bcryptjs';

/**
 * reserved_by (tekst) → user_id (FK).
 * Działa też na bazie z danymi: tworzy brakujących USER-ów i przepisuje FK.
 */
export async function up(knex) {
    await knex.schema.alterTable('reservations', (table) => {
        table.integer('user_id').unsigned().nullable();
    });

    const names = await knex('reservations').distinct('reserved_by').pluck('reserved_by');
    const passwordHash = await bcrypt.hash('migrated-user-password', 10);

    for (const reservedBy of names) {
        const email = `${slugEmail(reservedBy)}@seed.local`;
        let user = await knex('users').where({ email }).first();
        if (!user) {
            const [created] = await knex('users')
                .insert({
                    email,
                    password_hash: passwordHash,
                    role: 'USER'
                })
                .returning('*');
            user = created;
        }

        await knex('reservations').where({ reserved_by: reservedBy }).update({ user_id: user.id });
    }

    await knex.schema.alterTable('reservations', (table) => {
        table.integer('user_id').unsigned().notNullable().alter();
        table
            .foreign('user_id')
            .references('id')
            .inTable('users')
            .onDelete('RESTRICT');
        table.dropColumn('reserved_by');
    });
}

export async function down(knex) {
    await knex.schema.alterTable('reservations', (table) => {
        table.string('reserved_by').nullable();
    });

    const rows = await knex('reservations')
        .join('users', 'reservations.user_id', 'users.id')
        .select('reservations.id', 'users.email');

    for (const row of rows) {
        await knex('reservations')
            .where({ id: row.id })
            .update({ reserved_by: row.email });
    }

    await knex.schema.alterTable('reservations', (table) => {
        table.dropForeign(['user_id']);
        table.dropColumn('user_id');
        table.string('reserved_by').notNullable().alter();
    });
}

function slugEmail(name) {
    return String(name)
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '')
        .slice(0, 64) || 'user';
}
