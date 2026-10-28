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

function createReservationsRepository(knex) {
    return {
        async findAll() {
            const rows = await knex('reservations').select('*').orderBy('id');
            return rows.map(mapReservation);
        },

        async findById(id) {
            const row = await knex('reservations').where({ id }).first();
            return row ? mapReservation(row) : null;
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
