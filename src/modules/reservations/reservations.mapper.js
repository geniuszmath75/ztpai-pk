function toUtcIso(value) {
    if (value == null) {
        return null;
    }
    return new Date(value).toISOString();
}

function toReservationResponse(reservation) {
    return {
        id: reservation.id,
        roomId: reservation.roomId,
        reservedBy: reservation.reservedBy,
        participants: reservation.participants,
        startTime: toUtcIso(reservation.startTime),
        endTime: toUtcIso(reservation.endTime),
        status: reservation.status,
        createdAt: toUtcIso(reservation.createdAt),
        cancelledAt: toUtcIso(reservation.cancelledAt)
    };
}

export { toReservationResponse };
