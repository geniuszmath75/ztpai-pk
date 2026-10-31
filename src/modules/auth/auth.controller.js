import { toUserResponse } from './auth.mapper.js';

function createAuthController({ authService }) {
    return {
        async register(req, res) {
            const user = await authService.register(req.validated.body);
            res.status(201).json(toUserResponse(user));
        },

        async login(req, res) {
            const tokens = await authService.login(req.validated.body);
            res.json(tokens);
        },

        async me(req, res) {
            const user = await authService.me(req.user.id);
            res.json(toUserResponse(user));
        }
    };
}

export { createAuthController };
