import { NotFoundError } from '../../errors/AppError.js';

function createRoomsService({ roomsRepository }) {
    return {
        async list() {
            return roomsRepository.findAll();
        },

        async getById(id) {
            const room = await roomsRepository.findById(id);
            if (!room) {
                throw new NotFoundError('Room not found');
            }
            return room;
        }
    };
}

export { createRoomsService };
