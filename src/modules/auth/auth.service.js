import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, NotFoundError } from '../../errors/AppError.js';

const BCRYPT_COST = 10;
const INVALID_CREDENTIALS = 'Invalid email or password';

function createAuthService({ authRepository, jwtSecret, jwtExpiresIn }) {
    return {
        async register({ email, password }) {
            const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
            return authRepository.create({
                email,
                passwordHash,
                role: 'USER'
            });
        },

        async login({ email, password }) {
            const user = await authRepository.findByEmail(email);
            // ten sam 401 dla złego emaila i złego hasła
            if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
                throw new UnauthorizedError(INVALID_CREDENTIALS, 'INVALID_CREDENTIALS');
            }

            const accessToken = jwt.sign({ role: user.role }, jwtSecret, {
                algorithm: 'HS256',
                expiresIn: jwtExpiresIn,
                subject: String(user.id)
            });

            return {
                accessToken,
                tokenType: 'Bearer',
                expiresIn: jwtExpiresIn
            };
        },

        async me(userId) {
            const user = await authRepository.findById(userId);
            if (!user) {
                throw new NotFoundError('User not found');
            }
            return user;
        }
    };
}

export { createAuthService };
