import { NotFoundError } from '../../errors/AppError.js';

function createBuildingsService({ buildingsRepository }) {
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

        async create(payload) {
            return buildingsRepository.create(payload);
        }
    };
}

export { createBuildingsService };
