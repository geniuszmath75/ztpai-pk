import pg from 'pg';
import { config } from '../src/config/index.js';

const BASE_URL = 'http://localhost:3000';
const ROOM_ID = 1;
const START = '2028-06-01T10:00:00.000Z';
const END = '2028-06-01T12:00:00.000Z';

const body = {
    roomId: ROOM_ID,
    participants: 2,
    startTime: START,
    endTime: END
};

async function main() {
    const client = new pg.Client({ connectionString: config.databaseUrl });
    await client.connect();

    // czyścimy ten slot, żeby test był powtarzalny
    await client.query(
        `DELETE FROM reservations
         WHERE room_id = $1 AND start_time = $2::timestamptz AND end_time = $3::timestamptz`,
        [ROOM_ID, START, END]
    );

    const requests = Array.from({ length: 10 }, () =>
        fetch(`${BASE_URL}/api/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }).then(async (res) => {
            const text = await res.text();
            return { status: res.status, body: text };
        })
    );

    const results = await Promise.all(requests);
    results.forEach((r, i) => {
        console.log(`#${i + 1}: ${r.status}`);
    });

    const counts = results.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
    }, {});
    console.log('summary:', counts);

    const { rows } = await client.query(
        `SELECT count(*)::int AS confirmed
         FROM reservations
         WHERE room_id = $1
           AND status = 'CONFIRMED'
           AND start_time = $2::timestamptz
           AND end_time = $3::timestamptz`,
        [ROOM_ID, START, END]
    );
    console.log('CONFIRMED in DB for slot:', rows[0].confirmed);

    await client.end();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
