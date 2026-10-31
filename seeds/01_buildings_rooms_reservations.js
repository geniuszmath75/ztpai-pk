import bcrypt from 'bcryptjs';

/**
 * Idempotentny seed: truncate + RESTART IDENTITY → ID zawsze od 1.
 * ADMIN tylko tutaj — nie da się go utworzyć przez API rejestracji.
 */
export async function seed(knex) {
    await knex.raw('TRUNCATE reservations, rooms, buildings, users RESTART IDENTITY CASCADE');

    const adminPasswordHash = await bcrypt.hash('admin-super-secret-password', 10);
    await knex('users').insert({
        email: 'admin@example.com',
        password_hash: adminPasswordHash,
        role: 'ADMIN'
    });

    await knex('buildings').insert([
        { name: 'Budynek A', address: 'ul. Warszawska 24, Kraków' },
        { name: 'Budynek B', address: 'ul. Warszawska 26, Kraków' }
    ]);

    await knex('rooms').insert([
        { building_id: 1, name: '101', capacity: 30 },
        { building_id: 1, name: '102', capacity: 16 },
        { building_id: 1, name: 'Aula', capacity: 100 },
        { building_id: 2, name: '101', capacity: 20 },
        { building_id: 2, name: 'Lab', capacity: 12 }
    ]);

    await knex('reservations').insert([
        // już rozpoczęta
        {
            room_id: 1,
            reserved_by: 'Seed User',
            participants: 10,
            start_time: '2020-06-01T10:00:00.000Z',
            end_time: '2020-06-01T12:00:00.000Z',
            status: 'CONFIRMED',
            cancelled_at: null,
            created_at: '2020-05-20T08:00:00.000Z'
        },
        {
            room_id: 2,
            reserved_by: 'Anna Nowak',
            participants: 8,
            start_time: '2026-11-10T10:00:00.000Z',
            end_time: '2026-11-10T12:00:00.000Z',
            status: 'CONFIRMED',
            cancelled_at: null,
            created_at: '2026-10-01T08:00:00.000Z'
        },
        // CANCELLED
        {
            room_id: 3,
            reserved_by: 'Jan Kowalski',
            participants: 20,
            start_time: '2026-12-01T09:00:00.000Z',
            end_time: '2026-12-01T11:00:00.000Z',
            status: 'CANCELLED',
            cancelled_at: '2026-10-15T12:00:00.000Z',
            created_at: '2026-10-01T09:00:00.000Z'
        },
        {
            room_id: 4,
            reserved_by: 'Piotr Wisniewski',
            participants: 5,
            start_time: '2026-11-15T14:00:00.000Z',
            end_time: '2026-11-15T16:00:00.000Z',
            status: 'CONFIRMED',
            cancelled_at: null,
            created_at: '2026-10-05T10:00:00.000Z'
        },
        {
            room_id: 5,
            reserved_by: 'Maria Zielinska',
            participants: 6,
            start_time: '2026-11-20T08:00:00.000Z',
            end_time: '2026-11-20T10:00:00.000Z',
            status: 'CONFIRMED',
            cancelled_at: null,
            created_at: '2026-10-10T11:00:00.000Z'
        }
    ]);
}
