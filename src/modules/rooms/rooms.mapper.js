function toRoomResponse(room) {
    return {
        id: room.id,
        buildingId: room.buildingId,
        name: room.name,
        capacity: room.capacity
    };
}

function toRoomWithBuildingResponse(room) {
    return {
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        building: room.building
    };
}

export { toRoomResponse, toRoomWithBuildingResponse };
