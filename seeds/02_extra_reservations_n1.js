/**
 * Dodatkowe 15 rezerwacji pod demo braku N+1 (5 z 01 + 15 = 20).
 * Uruchamiane po 01 — bez truncate. user_id 2..6 cyklicznie.
 */
export async function seed(knex) {
    const rows = [];
    for (let i = 1; i <= 15; i++) {
        const day = String(i).padStart(2, '0');
        rows.push({
            room_id: ((i - 1) % 5) + 1,
            user_id: ((i - 1) % 5) + 2,
            participants: 2,
            start_time: `2027-01-${day}T10:00:00.000Z`,
            end_time: `2027-01-${day}T11:00:00.000Z`,
            status: 'CONFIRMED',
            cancelled_at: null,
            created_at: '2026-10-20T12:00:00.000Z'
        });
    }
    await knex('reservations').insert(rows);
}
