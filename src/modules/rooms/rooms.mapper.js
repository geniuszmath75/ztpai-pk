function toRoomResponse(room) {
    return {
        id: room.id,
        buildingId: room.buildingId,
        name: room.name,
        capacity: room.capacity
    };
}

export { toRoomResponse };
