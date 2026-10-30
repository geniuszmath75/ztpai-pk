const SORT_COLUMNS = {
    startTime: 'reservations.start_time',
    '-startTime': 'reservations.start_time',
    createdAt: 'reservations.created_at',
    '-createdAt': 'reservations.created_at',
    participants: 'reservations.participants',
    '-participants': 'reservations.participants'
};

function mapReservation(row) {
    return {
        id: row.id,
        roomId: row.room_id,
        reservedBy: row.reserved_by,
        participants: row.participants,
        startTime: new Date(row.start_time).toISOString(),
        endTime: new Date(row.end_time).toISOString(),
        status: row.status,
        createdAt: new Date(row.created_at).toISOString(),
        cancelledAt: row.cancelled_at ? new Date(row.cancelled_at).toISOString() : null
    };
}

function mapReservationWithDetails(row) {
    return {
        id: row.id,
        reservedBy: row.reserved_by,
        participants: row.participants,
        startTime: new Date(row.start_time).toISOString(),
        endTime: new Date(row.end_time).toISOString(),
        status: row.status,
        createdAt: new Date(row.created_at).toISOString(),
        cancelledAt: row.cancelled_at ? new Date(row.cancelled_at).toISOString() : null,
        room: {
            id: row.room_id_joined,
            name: row.room_name,
            building: {
                id: row.building_id,
                name: row.building_name
            }
        }
    };
}

function detailsQuery(knex) {
    return knex('reservations')
        .join('rooms', 'reservations.room_id', 'rooms.id')
        .join('buildings', 'rooms.building_id', 'buildings.id')
        .select(
            'reservations.id',
            'reservations.reserved_by',
            'reservations.participants',
            'reservations.start_time',
            'reservations.end_time',
            'reservations.status',
            'reservations.created_at',
            'reservations.cancelled_at',
            'rooms.id as room_id_joined',
            'rooms.name as room_name',
            'buildings.id as building_id',
            'buildings.name as building_name'
        );
}

function applyListFilters(q, { roomId, buildingId, status, from, to }) {
    if (roomId !== undefined) {
        q.where('reservations.room_id', roomId);
    }
    if (buildingId !== undefined) {
        q.where('rooms.building_id', buildingId);
    }
    if (status !== undefined) {
        q.where('reservations.status', status);
    }
    // nakładanie [from, to) ∩ [start, end) ⇔ start < to && from < end
    if (from !== undefined) {
        q.where('reservations.end_time', '>', from);
    }
    if (to !== undefined) {
        q.where('reservations.start_time', '<', to);
    }
    return q;
}

function createReservationsRepository(knex) {
    return {
        async findAll() {
            const rows = await knex('reservations').select('*').orderBy('id');
            return rows.map(mapReservation);
        },

        async findPage(filters) {
            const { page, limit, sort } = filters;
            const column = SORT_COLUMNS[sort];
            const direction = sort.startsWith('-') ? 'desc' : 'asc';
            const offset = (page - 1) * limit;

            const countQ = knex('reservations')
                .join('rooms', 'reservations.room_id', 'rooms.id')
                .join('buildings', 'rooms.building_id', 'buildings.id')
                .countDistinct('reservations.id as total');
            applyListFilters(countQ, filters);
            const countRow = await countQ.first();
            const total = Number(countRow.total);

            const dataQ = detailsQuery(knex);
            applyListFilters(dataQ, filters);
            dataQ
                .orderBy(column, direction)
                .orderBy('reservations.id', 'asc')
                .limit(limit)
                .offset(offset);

            const rows = await dataQ;
            return {
                rows: rows.map(mapReservationWithDetails),
                total
            };
        },

        async findById(id) {
            const row = await knex('reservations').where({ id }).first();
            return row ? mapReservation(row) : null;
        },

        async findByIdWithDetails(id) {
            const row = await detailsQuery(knex).where('reservations.id', id).first();
            return row ? mapReservationWithDetails(row) : null;
        },

        async findConfirmedByRoomId(roomId) {
            const rows = await knex('reservations')
                .where({ room_id: roomId, status: 'CONFIRMED' })
                .select('*');
            return rows.map(mapReservation);
        },

        async create(data) {
            const [row] = await knex('reservations')
                .insert({
                    room_id: data.roomId,
                    reserved_by: data.reservedBy,
                    participants: data.participants,
                    start_time: data.startTime,
                    end_time: data.endTime,
                    status: data.status,
                    cancelled_at: data.cancelledAt,
                    created_at: data.createdAt
                })
                .returning('*');
            return mapReservation(row);
        },

        async save(reservation) {
            const [row] = await knex('reservations')
                .where({ id: reservation.id })
                .update({
                    room_id: reservation.roomId,
                    reserved_by: reservation.reservedBy,
                    participants: reservation.participants,
                    start_time: reservation.startTime,
                    end_time: reservation.endTime,
                    status: reservation.status,
                    cancelled_at: reservation.cancelledAt,
                    created_at: reservation.createdAt
                })
                .returning('*');
            return row ? mapReservation(row) : null;
        }
    };
}

export { createReservationsRepository };
