import bcrypt from 'bcryptjs';

const BCRYPT_COST = 10;

function createAuthService({ authRepository }) {
    return {
        async register({ email, password }) {
            const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
            return authRepository.create({
                email,
                passwordHash,
                role: 'USER'
            });
        }
    };
}

export { createAuthService };
