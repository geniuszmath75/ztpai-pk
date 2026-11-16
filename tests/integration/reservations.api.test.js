import bcrypt from 'bcryptjs';
import pg from 'pg';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createKnex } from '../../src/db/knex.js';
import { createAuthRepository } from '../../src/modules/auth/auth.repository.knex.js';
import { createBuildingsRepository } from '../../src/modules/buildings/buildings.repository.knex.js';
import { createRoomsRepository } from '../../src/modules/rooms/rooms.repository.knex.js';
import { createReservationsRepository } from '../../src/modules/reservations/reservations.repository.knex.js';

const { Client } = pg;
const NOW = new Date('2026-11-15T18:00:00.000Z');
const PASSWORD = 'integration-password-123';

let knex;
let app;
let fixtures;

async function ensureTestDatabase() {
    const testUrl = new URL(process.env.TEST_DATABASE_URL);
    const databaseName = testUrl.pathname.slice(1);
    const adminUrl = new URL(testUrl);
    adminUrl.pathname = '/postgres';
    const client = new Client(adminUrl.toString());

    await client.connect();
    try {
        const result = await client.query(
            'SELECT 1 FROM pg_database WHERE datname = $1',
            [databaseName]
        );
        if (result.rowCount === 0) {
            await client.query(`CREATE DATABASE "${databaseName}"`);
        }
    } finally {
        await client.end();
    }
}

async function resetDatabase() {
    await knex.raw(
        'TRUNCATE audit_log, reservations, rooms, buildings, users RESTART IDENTITY CASCADE'
    );

    const passwordHash = await bcrypt.hash(PASSWORD, 4);
    const users = await knex('users')
        .insert([
            { email: 'admin@test.local', password_hash: passwordHash, role: 'ADMIN' },
            { email: 'user@test.local', password_hash: passwordHash, role: 'USER' },
            { email: 'other@test.local', password_hash: passwordHash, role: 'USER' }
        ])
        .returning('*');

    const [building] = await knex('buildings')
        .insert({ name: 'Test Building', address: 'Test Street 1' })
        .returning('*');
    const rooms = await knex('rooms')
        .insert([
            { building_id: building.id, name: 'Test Room 1', capacity: 30 },
            { building_id: building.id, name: 'Test Room 2', capacity: 20 }
        ])
        .returning('*');

    fixtures = {
        admin: users[0],
        user: users[1],
        other: users[2],
        building,
        room: rooms[0],
        secondRoom: rooms[1]
    };
}

async function tokenFor(user) {
    const response = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: PASSWORD });

    expect(response.status).toBe(200);
    return response.body.accessToken;
}

function reservationPayload(overrides = {}) {
    return {
        roomId: fixtures.room.id,
        participants: 2,
        startTime: '2026-11-16T10:00:00.000Z',
        endTime: '2026-11-16T11:00:00.000Z',
        ...overrides
    };
}

async function createReservation(token, overrides = {}) {
    return request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send(reservationPayload(overrides));
}

beforeAll(async () => {
    await ensureTestDatabase();
    knex = createKnex();
    await knex.migrate.latest();

    const authRepository = createAuthRepository(knex);
    const buildingsRepository = createBuildingsRepository(knex);
    const roomsRepository = createRoomsRepository(knex);
    const reservationsRepository = createReservationsRepository(knex);
    const runInTransaction = (callback) =>
        knex.transaction((trx) =>
            callback({
                buildingsRepository: createBuildingsRepository(trx),
                roomsRepository: createRoomsRepository(trx),
                reservationsRepository: createReservationsRepository(trx)
            })
        );

    app = createApp({
        authRepository,
        buildingsRepository,
        roomsRepository,
        reservationsRepository,
        runInTransaction,
        jwtSecret: process.env.JWT_SECRET,
        jwtExpiresIn: process.env.JWT_EXPIRES_IN,
        now: () => new Date(NOW)
    });
});

beforeEach(async () => {
    await resetDatabase();
});

afterAll(async () => {
    if (knex) {
        await knex.destroy();
    }
});

test('registers, logs in and returns the authenticated user from /me', async () => {
    const email = 'new-user@test.local';
    const password = 'new-user-password';

    const registration = await request(app)
        .post('/api/auth/register')
        .send({ email, password });
    expect(registration.status).toBe(201);
    expect(registration.body).toMatchObject({ email, role: 'USER' });

    const login = await request(app)
        .post('/api/auth/login')
        .send({ email, password });
    expect(login.status).toBe(200);

    const me = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({ email, role: 'USER' });
});

test('creates a reservation, returns Location and persists the row', async () => {
    const token = await tokenFor(fixtures.user);

    const response = await createReservation(token);

    expect(response.status).toBe(201);
    expect(response.headers.location).toBe(`/api/reservations/${response.body.id}`);

    const row = await knex('reservations').where({ id: response.body.id }).first();
    expect(row).toMatchObject({
        room_id: fixtures.room.id,
        user_id: fixtures.user.id,
        status: 'CONFIRMED'
    });
});

test('returns validation details for an invalid reservation body', async () => {
    const token = await tokenFor(fixtures.user);

    const response = await createReservation(token, { participants: 0 });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ location: 'body', field: 'participants' })
        ])
    );
});

test('returns 401 when a protected endpoint has no token', async () => {
    const response = await request(app).get('/api/reservations');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
});

test('returns 403 when USER tries to create a room', async () => {
    const token = await tokenFor(fixtures.user);

    const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({
            buildingId: fixtures.building.id,
            name: 'Forbidden Room',
            capacity: 10
        });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
});

test('returns 404 when USER requests another user reservation', async () => {
    const ownerToken = await tokenFor(fixtures.user);
    const otherToken = await tokenFor(fixtures.other);
    const created = await createReservation(ownerToken);

    const response = await request(app)
        .get(`/api/reservations/${created.body.id}`)
        .set('Authorization', `Bearer ${otherToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
});

test('returns ROOM_ALREADY_BOOKED for an overlapping reservation', async () => {
    const token = await tokenFor(fixtures.user);
    await createReservation(token);

    const response = await createReservation(token);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('ROOM_ALREADY_BOOKED');
});

test('returns pagination metadata and only the requested number of rows', async () => {
    const token = await tokenFor(fixtures.user);
    await createReservation(token, {
        startTime: '2026-11-16T10:00:00.000Z',
        endTime: '2026-11-16T11:00:00.000Z'
    });
    await createReservation(token, {
        startTime: '2026-11-16T12:00:00.000Z',
        endTime: '2026-11-16T13:00:00.000Z'
    });
    await createReservation(token, {
        startTime: '2026-11-16T14:00:00.000Z',
        endTime: '2026-11-16T15:00:00.000Z'
    });

    const response = await request(app)
        .get('/api/reservations')
        .query({ page: 1, limit: 2, sort: 'startTime' })
        .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.meta.total).toBe(3);
    expect(response.body.data).toHaveLength(2);
});
