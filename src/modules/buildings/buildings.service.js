import { NotFoundError } from '../../errors/AppError.js';

function createBuildingsService({ buildingsRepository, roomsRepository }) {
    return {
        async list() {
            return buildingsRepository.findAll();
        },

        async getById(id) {
            const building = await buildingsRepository.findById(id);
            if (!building) {
                throw new NotFoundError('Building not found');
            }
            return building;
        },

        async listRooms(buildingId) {
            const building = await buildingsRepository.findById(buildingId);
            if (!building) {
                throw new NotFoundError('Building not found');
            }
            return roomsRepository.findByBuildingId(buildingId);
        },

        async create(payload) {
            return buildingsRepository.create(payload);
        }
    };
}

export { createBuildingsService };
