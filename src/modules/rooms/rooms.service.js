import { NotFoundError } from '../../errors/AppError.js';

function createRoomsService({ roomsRepository, buildingsRepository }) {
    return {
        async list() {
            return roomsRepository.findAll();
        },

        async getById(id) {
            const room = await roomsRepository.findByIdWithBuilding(id);
            if (!room) {
                throw new NotFoundError('Room not found');
            }
            return room;
        },

        async create({ buildingId, name, capacity }) {
            const building = await buildingsRepository.findById(buildingId);
            if (!building) {
                throw new NotFoundError('Building not found');
            }
            return roomsRepository.create({ buildingId, name, capacity });
        }
    };
}

export { createRoomsService };
