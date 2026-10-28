import {
    BadRequestError,
    ConflictError,
    NotFoundError
} from '../../errors/AppError.js';

const MIN_DURATION_MS = 15 * 60 * 1000;
const MAX_DURATION_MS = 8 * 60 * 60 * 1000;

const ALLOWED_TRANSITIONS = {
    CONFIRMED: ['CANCELLED'],
    CANCELLED: []
};

function overlaps(aStart, aEnd, bStart, bEnd) {
    // półotwarte przedziały [start, end)
    return aStart < bEnd && bStart < aEnd;
}

function createReservationsService({
    reservationsRepository,
    roomsRepository,
    now = () => new Date()
}) {
    async function list(roomId) {
        return reservationsRepository.findAllWithDetails(roomId);
    }

    async function getById(id) {
        const reservation = await reservationsRepository.findByIdWithDetails(id);
        if (!reservation) {
            throw new NotFoundError('Reservation not found');
        }
        return reservation;
    }

    async function create(payload) {
        const startMs = new Date(payload.startTime).getTime();
        const endMs = new Date(payload.endTime).getTime();
        const nowMs = now().getTime();

        if (!(endMs > startMs)) {
            throw new BadRequestError(
                'INVALID_TIME_RANGE',
                'endTime must be later than startTime'
            );
        }

        const durationMs = endMs - startMs;
        if (durationMs < MIN_DURATION_MS || durationMs > MAX_DURATION_MS) {
            throw new BadRequestError(
                'INVALID_DURATION',
                'Reservation must last between 15 minutes and 8 hours'
            );
        }

        if (startMs < nowMs) {
            throw new BadRequestError(
                'START_TIME_IN_PAST',
                'startTime cannot be in the past'
            );
        }

        const room = await roomsRepository.findById(payload.roomId);
        if (!room) {
            throw new NotFoundError('Room not found');
        }

        if (payload.participants > room.capacity) {
            throw new ConflictError(
                'ROOM_CAPACITY_EXCEEDED',
                'Room capacity exceeded'
            );
        }

        const active = await reservationsRepository.findConfirmedByRoomId(payload.roomId);
        const conflict = active.some((existing) =>
            overlaps(
                startMs,
                endMs,
                new Date(existing.startTime).getTime(),
                new Date(existing.endTime).getTime()
            )
        );

        if (conflict) {
            throw new ConflictError(
                'ROOM_ALREADY_BOOKED',
                'Room already has an overlapping confirmed reservation'
            );
        }

        return reservationsRepository.create({
            roomId: payload.roomId,
            reservedBy: payload.reservedBy,
            participants: payload.participants,
            startTime: new Date(payload.startTime).toISOString(),
            endTime: new Date(payload.endTime).toISOString(),
            status: 'CONFIRMED',
            createdAt: now().toISOString(),
            cancelledAt: null,
            internalNote: 'created via API v2'
        });
    }

    async function cancel(id) {
        const reservation = await reservationsRepository.findById(id);
        if (!reservation) {
            throw new NotFoundError('Reservation not found');
        }

        if (reservation.status === 'CANCELLED') {
            return reservation;
        }

        const allowed = ALLOWED_TRANSITIONS[reservation.status] ?? [];
        if (!allowed.includes('CANCELLED')) {
            throw new ConflictError(
                'INVALID_STATUS_TRANSITION',
                `Cannot transition from ${reservation.status} to CANCELLED`
            );
        }

        const startMs = new Date(reservation.startTime).getTime();
        if (startMs <= now().getTime()) {
            throw new ConflictError(
                'RESERVATION_ALREADY_STARTED',
                'Cannot cancel a reservation that has already started'
            );
        }

        reservation.status = 'CANCELLED';
        reservation.cancelledAt = now().toISOString();
        return reservationsRepository.save(reservation);
    }

    return { list, getById, create, cancel };
}

export { createReservationsService };
