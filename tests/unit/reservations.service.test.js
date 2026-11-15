import { createReservationsService } from '../../src/modules/reservations/reservations.service.js';
import { createReservationsRepository } from '../../src/modules/reservations/reservations.repository.memory.js';
import { createRoomsRepository } from '../../src/modules/rooms/rooms.repository.memory.js';

const NOW = new Date('2026-11-15T18:00:00.000Z');
const USER = { id: 10, role: 'USER' };
const ADMIN = { id: 99, role: 'ADMIN' };

function createTestContext() {
    const reservationsRepository = createReservationsRepository();
    const roomsRepository = createRoomsRepository();
    const service = createReservationsService({
        reservationsRepository,
        roomsRepository,
        now: () => new Date(NOW)
    });

    return { service };
}

function reservationPayload(overrides = {}) {
    return {
        roomId: 1,
        participants: 2,
        startTime: '2026-11-16T10:00:00.000Z',
        endTime: '2026-11-16T12:00:00.000Z',
        ...overrides
    };
}

describe('reservations service', () => {
    test.each([
        ['partial overlap', '2026-11-16T11:00:00.000Z', '2026-11-16T13:00:00.000Z'],
        ['contained interval', '2026-11-16T10:30:00.000Z', '2026-11-16T11:30:00.000Z']
    ])('%s in the same room is rejected', async (_, startTime, endTime) => {
        const { service } = createTestContext();
        await service.create(reservationPayload(), USER);

        await expect(
            service.create(reservationPayload({ startTime, endTime }), USER)
        ).rejects.toMatchObject({ code: 'ROOM_ALREADY_BOOKED' });
    });

    test('intervals that only touch are allowed', async () => {
        const { service } = createTestContext();
        await service.create(
            reservationPayload({
                startTime: '2026-11-16T10:00:00.000Z',
                endTime: '2026-11-16T11:00:00.000Z'
            }),
            USER
        );

        const result = await service.create(
            reservationPayload({
                startTime: '2026-11-16T11:00:00.000Z',
                endTime: '2026-11-16T12:00:00.000Z'
            }),
            USER
        );

        expect(result.status).toBe('CONFIRMED');
    });

    test('reservation in another room is allowed', async () => {
        const { service } = createTestContext();
        await service.create(reservationPayload(), USER);

        const result = await service.create(
            reservationPayload({ roomId: 2 }),
            USER
        );

        expect(result.roomId).toBe(2);
    });

    test('CANCELLED reservation does not block the interval', async () => {
        const { service } = createTestContext();
        const first = await service.create(reservationPayload(), USER);
        await service.cancel(first.id, USER);

        const result = await service.create(reservationPayload(), USER);

        expect(result.status).toBe('CONFIRMED');
    });

    test.each([
        ['participants equal capacity', 30, undefined],
        ['participants above capacity', 31, 'ROOM_CAPACITY_EXCEEDED']
    ])('%s', async (_, participants, errorCode) => {
        const { service } = createTestContext();
        const operation = service.create(reservationPayload({ participants }), USER);

        if (errorCode) {
            await expect(operation).rejects.toMatchObject({ code: errorCode });
        } else {
            await expect(operation).resolves.toMatchObject({ participants });
        }
    });

    test.each([
        ['exactly 15 minutes', 15, true],
        ['exactly 8 hours', 8 * 60, true],
        ['14 minutes', 14, false],
        ['8 hours and 1 minute', 8 * 60 + 1, false]
    ])('%s duration', async (_, durationMinutes, isAllowed) => {
        const { service } = createTestContext();
        const endTime = new Date(
            new Date('2026-11-16T10:00:00.000Z').getTime() +
                durationMinutes * 60 * 1000
        ).toISOString();
        const operation = service.create(
            reservationPayload({ endTime }),
            USER
        );

        if (isAllowed) {
            await expect(operation).resolves.toBeDefined();
        } else {
            await expect(operation).rejects.toMatchObject({
                code: 'INVALID_DURATION'
            });
        }
    });

    test('cannot cancel a reservation that has already started', async () => {
        const { service } = createTestContext();

        await expect(service.cancel(1, { id: 1, role: 'USER' })).rejects.toMatchObject({
            code: 'RESERVATION_ALREADY_STARTED'
        });
    });

    test('cancelling twice is idempotent and keeps cancelledAt unchanged', async () => {
        const { service } = createTestContext();
        const reservation = await service.create(reservationPayload(), USER);

        const firstCancellation = await service.cancel(reservation.id, USER);
        const secondCancellation = await service.cancel(reservation.id, USER);

        expect(secondCancellation.status).toBe('CANCELLED');
        expect(secondCancellation.cancelledAt).toBe(firstCancellation.cancelledAt);
    });

    test('a USER cannot cancel another user reservation', async () => {
        const { service } = createTestContext();
        const reservation = await service.create(reservationPayload(), USER);

        await expect(
            service.cancel(reservation.id, { id: 11, role: 'USER' })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    test('ADMIN can cancel another user reservation', async () => {
        const { service } = createTestContext();
        const reservation = await service.create(reservationPayload(), USER);

        await expect(service.cancel(reservation.id, ADMIN)).resolves.toMatchObject({
            status: 'CANCELLED'
        });
    });
});
