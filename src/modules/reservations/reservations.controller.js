import {
    toReservationResponse,
    toReservationDetailsResponse
} from './reservations.mapper.js';

function createReservationsController({ reservationsService }) {
    return {
        async list(req, res) {
            const roomId = req.validated.query?.roomId;
            const reservations = await reservationsService.list(roomId);
            res.json(reservations.map(toReservationDetailsResponse));
        },

        async getById(req, res) {
            const reservation = await reservationsService.getById(req.validated.params.id);
            res.json(toReservationDetailsResponse(reservation));
        },

        async create(req, res) {
            const reservation = await reservationsService.create(req.validated.body);
            res
                .status(201)
                .location(`/api/reservations/${reservation.id}`)
                .json(toReservationResponse(reservation));
        },

        async cancel(req, res) {
            const reservation = await reservationsService.cancel(req.validated.params.id);
            res.json(toReservationResponse(reservation));
        }
    };
}

export { createReservationsController };
