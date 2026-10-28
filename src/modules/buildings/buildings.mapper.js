function toBuildingResponse(building) {
    const body = {
        id: building.id,
        name: building.name,
        address: building.address
    };
    if (building.roomsCount !== undefined) {
        body.roomsCount = building.roomsCount;
    }
    return body;
}

export { toBuildingResponse };
