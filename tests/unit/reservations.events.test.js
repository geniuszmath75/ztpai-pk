import { jest } from '@jest/globals';
import { createReservationsService } from '../../src/modules/reservations/reservations.service.js';
import { createReservationsRepository } from '../../src/modules/reservations/reservations.repository.memory.js';
import { createRoomsRepository } from '../../src/modules/rooms/rooms.repository.memory.js';

const NOW = new Date('2026-11-15T18:00:00.000Z');
const USER = { id: 10, role: 'USER' };

function createTestContext() {
    const eventBus = { publish: jest.fn().mockResolvedValue(undefined) };
    const service = createReservationsService({
        reservationsRepository: createReservationsRepository(),
        roomsRepository: createRoomsRepository(),
        eventBus,
        now: () => new Date(NOW)
    });
    return { eventBus, service };
}

const payload = {
    roomId: 1,
    participants: 2,
    startTime: '2026-11-16T10:00:00.000Z',
    endTime: '2026-11-16T11:00:00.000Z'
};

test('publishes reservation.created after a successful reservation', async () => {
    const { eventBus, service } = createTestContext();

    const reservation = await service.create(payload, USER);

    expect(eventBus.publish).toHaveBeenCalledWith('reservation.created', {
        reservationId: reservation.id,
        roomId: 1,
        userId: USER.id,
        startTime: reservation.startTime,
        endTime: reservation.endTime
    });
});

test('does not publish an event after a failed reservation', async () => {
    const { eventBus, service } = createTestContext();
    await service.create(payload, USER);
    eventBus.publish.mockClear();

    await expect(service.create(payload, USER)).rejects.toMatchObject({
        code: 'ROOM_ALREADY_BOOKED'
    });

    expect(eventBus.publish).not.toHaveBeenCalled();
});

test('publishes cancellation once and skips an idempotent cancellation', async () => {
    const { eventBus, service } = createTestContext();
    const reservation = await service.create(payload, USER);
    eventBus.publish.mockClear();

    await service.cancel(reservation.id, USER);
    await service.cancel(reservation.id, USER);

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledWith(
        'reservation.cancelled',
        expect.objectContaining({
            reservationId: reservation.id,
            roomId: 1,
            userId: USER.id,
            cancelledBy: USER.id
        })
    );
});
