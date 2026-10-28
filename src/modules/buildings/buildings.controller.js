import { toBuildingResponse } from './buildings.mapper.js';
import { toRoomResponse } from '../rooms/rooms.mapper.js';

function createBuildingsController({ buildingsService }) {
    return {
        async list(_req, res) {
            const buildings = await buildingsService.list();
            res.json(buildings.map(toBuildingResponse));
        },

        async getById(req, res) {
            const building = await buildingsService.getById(req.validated.params.id);
            res.json(toBuildingResponse(building));
        },

        async listRooms(req, res) {
            const rooms = await buildingsService.listRooms(req.validated.params.id);
            res.json(rooms.map(toRoomResponse));
        },

        async create(req, res) {
            const building = await buildingsService.create(req.validated.body);
            res
                .status(201)
                .location(`/api/buildings/${building.id}`)
                .json(toBuildingResponse(building));
        }
    };
}

export { createBuildingsController };
