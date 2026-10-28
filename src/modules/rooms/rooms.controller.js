import { toRoomResponse } from './rooms.mapper.js';

function createRoomsController({ roomsService }) {
    return {
        async list(_req, res) {
            const rooms = await roomsService.list();
            res.json(rooms.map(toRoomResponse));
        },

        async getById(req, res) {
            const room = await roomsService.getById(req.validated.params.id);
            res.json(toRoomResponse(room));
        },

        async create(req, res) {
            const room = await roomsService.create(req.validated.body);
            res
                .status(201)
                .location(`/api/rooms/${room.id}`)
                .json(toRoomResponse(room));
        }
    };
}

export { createRoomsController };
