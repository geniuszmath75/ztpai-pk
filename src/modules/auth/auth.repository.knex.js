import { ConflictError } from '../../errors/AppError.js';

function mapUser(row) {
    return {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role,
        createdAt: new Date(row.created_at).toISOString()
    };
}

function createAuthRepository(knex) {
    return {
        async create({ email, passwordHash, role }) {
            try {
                const [row] = await knex('users')
                    .insert({
                        email,
                        password_hash: passwordHash,
                        role
                    })
                    .returning('*');
                return mapUser(row);
            } catch (err) {
                // UNIQUE email — także przy równoległych rejestracjach
                if (err.code === '23505') {
                    throw new ConflictError('EMAIL_TAKEN', 'Email is already registered');
                }
                throw err;
            }
        },

        async findByEmail(email) {
            const row = await knex('users').where({ email }).first();
            return row ? mapUser(row) : null;
        },

        async findById(id) {
            const row = await knex('users').where({ id }).first();
            return row ? mapUser(row) : null;
        }
    };
}

export { createAuthRepository };
