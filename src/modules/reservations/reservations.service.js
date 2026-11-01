import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
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

function canAccessReservation(reservation, currentUser) {
    return currentUser.role === 'ADMIN' || reservation.userId === currentUser.id;
}

function createReservationsService({
    reservationsRepository,
    roomsRepository,
    runInTransaction,
    now = () => new Date()
}) {
    async function list(query, currentUser) {
        const filters = { ...query };

        if (currentUser.role === 'USER') {
            // ?userId= tylko dla ADMIN — 403 zamiast ignorowania (jasny sygnał dla frontu)
            if (query.userId !== undefined) {
                throw new ForbiddenError('userId filter is allowed for ADMIN only');
            }
            filters.userId = currentUser.id;
        }

        const { page, limit } = filters;
        const { rows, total } = await reservationsRepository.findPage(filters);
        return {
            data: rows,
            meta: {
                page,
                limit,
                total,
                totalPages: limit > 0 ? Math.ceil(total / limit) : 0
            }
        };
    }

    async function getById(id, currentUser) {
        const reservation = await reservationsRepository.findByIdWithDetails(id);
        if (!reservation || !canAccessReservation(reservation, currentUser)) {
            throw new NotFoundError('Reservation not found');
        }
        return reservation;
    }

    async function createInRepos(payload, roomsRepo, reservationsRepo) {
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

        // FOR UPDATE na rooms — serializuje równoległe bookingi tej samej sali
        const room = await roomsRepo.findByIdForUpdate(payload.roomId);
        if (!room) {
            throw new NotFoundError('Room not found');
        }

        if (payload.participants > room.capacity) {
            throw new ConflictError(
                'ROOM_CAPACITY_EXCEEDED',
                'Room capacity exceeded'
            );
        }

        const active = await reservationsRepo.findConfirmedByRoomId(payload.roomId);
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

        return reservationsRepo.create({
            roomId: payload.roomId,
            userId: payload.userId,
            participants: payload.participants,
            startTime: new Date(payload.startTime).toISOString(),
            endTime: new Date(payload.endTime).toISOString(),
            status: 'CONFIRMED',
            createdAt: now().toISOString(),
            cancelledAt: null,
            internalNote: 'created via API v2'
        });
    }

    async function create(payload, currentUser) {
        const body = { ...payload, userId: currentUser.id };
        if (runInTransaction) {
            return runInTransaction(({ roomsRepository: roomsRepo, reservationsRepository: reservationsRepo }) =>
                createInRepos(body, roomsRepo, reservationsRepo)
            );
        }
        return createInRepos(body, roomsRepository, reservationsRepository);
    }

    async function cancel(id, currentUser) {
        const reservation = await reservationsRepository.findById(id);
        if (!reservation || !canAccessReservation(reservation, currentUser)) {
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

        // reguły biznesowe także dla ADMIN
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
