import { ConflictError } from '../../errors/AppError.js';

function createAuthRepository() {
    const users = [];
    let nextId = 1;

    return {
        async create({ email, passwordHash, role }) {
            if (users.some((user) => user.email === email)) {
                throw new ConflictError('EMAIL_TAKEN', 'Email is already registered');
            }

            const user = {
                id: nextId++,
                email,
                passwordHash,
                role,
                createdAt: new Date().toISOString()
            };
            users.push(user);
            return { ...user };
        }
    };
}

export { createAuthRepository };
