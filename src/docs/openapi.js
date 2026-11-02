const errorRef = { $ref: '#/components/schemas/ErrorResponse' };

const bearer = [{ bearerAuth: [] }];

const openApiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'Room Booking API',
        version: '1.0.0',
        description: 'Lab04 — auth, JWT, role/ownership'
    },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        },
        schemas: {
            ErrorResponse: {
                type: 'object',
                required: ['error'],
                properties: {
                    error: {
                        type: 'object',
                        required: ['code', 'message', 'requestId'],
                        properties: {
                            code: { type: 'string', example: 'VALIDATION_ERROR' },
                            message: { type: 'string' },
                            details: {
                                nullable: true,
                                description: 'Opcjonalne szczegóły (np. błędy walidacji)'
                            },
                            requestId: { type: 'string', format: 'uuid' }
                        }
                    }
                }
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: ['USER', 'ADMIN'] },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            LoginResponse: {
                type: 'object',
                properties: {
                    accessToken: { type: 'string' },
                    tokenType: { type: 'string', example: 'Bearer' },
                    expiresIn: { type: 'string', example: '15m' }
                }
            },
            Building: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    address: { type: 'string' },
                    roomsCount: { type: 'integer' }
                }
            },
            Room: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    buildingId: { type: 'integer' },
                    name: { type: 'string' },
                    capacity: { type: 'integer' }
                }
            },
            ReservationUser: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    email: { type: 'string', format: 'email' }
                }
            },
            Reservation: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    roomId: { type: 'integer' },
                    user: { $ref: '#/components/schemas/ReservationUser' },
                    participants: { type: 'integer' },
                    startTime: { type: 'string', format: 'date-time' },
                    endTime: { type: 'string', format: 'date-time' },
                    status: { type: 'string', enum: ['CONFIRMED', 'CANCELLED'] },
                    createdAt: { type: 'string', format: 'date-time' },
                    cancelledAt: { type: 'string', format: 'date-time', nullable: true }
                }
            },
            ReservationDetails: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    room: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer' },
                            name: { type: 'string' },
                            building: {
                                type: 'object',
                                properties: {
                                    id: { type: 'integer' },
                                    name: { type: 'string' }
                                }
                            }
                        }
                    },
                    user: { $ref: '#/components/schemas/ReservationUser' },
                    participants: { type: 'integer' },
                    startTime: { type: 'string', format: 'date-time' },
                    endTime: { type: 'string', format: 'date-time' },
                    status: { type: 'string', enum: ['CONFIRMED', 'CANCELLED'] },
                    createdAt: { type: 'string', format: 'date-time' },
                    cancelledAt: { type: 'string', format: 'date-time', nullable: true }
                }
            }
        }
    },
    paths: {
        '/api/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Rejestracja (zawsze rola USER)',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                additionalProperties: false,
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    password: { type: 'string', minLength: 10, maxLength: 72 }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'Utworzono',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/User' }
                            }
                        }
                    },
                    400: { description: 'Walidacja / nieznane pola', content: { 'application/json': { schema: errorRef } } },
                    409: { description: 'EMAIL_TAKEN', content: { 'application/json': { schema: errorRef } } }
                }
            }
        },
        '/api/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Logowanie — JWT HS256',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                additionalProperties: false,
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    password: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Token',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/LoginResponse' }
                            }
                        }
                    },
                    400: { description: 'Walidacja', content: { 'application/json': { schema: errorRef } } },
                    401: { description: 'INVALID_CREDENTIALS', content: { 'application/json': { schema: errorRef } } }
                }
            }
        },
        '/api/auth/me': {
            get: {
                tags: ['Auth'],
                summary: 'Bieżący użytkownik',
                security: bearer,
                responses: {
                    200: {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/User' }
                            }
                        }
                    },
                    401: { description: 'Brak/niepoprawny token', content: { 'application/json': { schema: errorRef } } },
                    404: { description: 'User not found', content: { 'application/json': { schema: errorRef } } }
                }
            }
        },
        '/api/buildings': {
            get: {
                tags: ['Buildings'],
                summary: 'Lista budynków',
                security: bearer,
                responses: {
                    200: {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Building' }
                                }
                            }
                        }
                    },
                    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorRef } } }
                }
            },
            post: {
                tags: ['Buildings'],
                summary: 'Utwórz budynek (ADMIN)',
                security: bearer,
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'address'],
                                additionalProperties: false,
                                properties: {
                                    name: { type: 'string', maxLength: 100 },
                                    address: { type: 'string', maxLength: 255 }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'Utworzono',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Building' }
                            }
                        }
                    },
                    400: { description: 'Walidacja', content: { 'application/json': { schema: errorRef } } },
                    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorRef } } },
                    403: { description: 'Forbidden (nie ADMIN)', content: { 'application/json': { schema: errorRef } } }
                }
            }
        },
        '/api/buildings/{id}': {
            get: {
                tags: ['Buildings'],
                summary: 'Budynek po id',
                security: bearer,
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }
                ],
                responses: {
                    200: {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Building' }
                            }
                        }
                    },
                    400: { description: 'Walidacja', content: { 'application/json': { schema: errorRef } } },
                    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorRef } } },
                    404: { description: 'Not found', content: { 'application/json': { schema: errorRef } } }
                }
            }
        },
        '/api/buildings/{id}/rooms': {
            get: {
                tags: ['Buildings'],
                summary: 'Sale budynku',
                security: bearer,
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }
                ],
                responses: {
                    200: {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Room' }
                                }
                            }
                        }
                    },
                    400: { description: 'Walidacja', content: { 'application/json': { schema: errorRef } } },
                    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorRef } } },
                    404: { description: 'Building not found', content: { 'application/json': { schema: errorRef } } }
                }
            }
        },
        '/api/rooms': {
            get: {
                tags: ['Rooms'],
                summary: 'Lista sal',
                security: bearer,
                responses: {
                    200: {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Room' }
                                }
                            }
                        }
                    },
                    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorRef } } }
                }
            },
            post: {
                tags: ['Rooms'],
                summary: 'Utwórz salę (ADMIN)',
                security: bearer,
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['buildingId', 'name', 'capacity'],
                                additionalProperties: false,
                                properties: {
                                    buildingId: { type: 'integer', minimum: 1 },
                                    name: { type: 'string' },
                                    capacity: { type: 'integer', minimum: 1 }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'Utworzono',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Room' }
                            }
                        }
                    },
                    400: { description: 'Walidacja', content: { 'application/json': { schema: errorRef } } },
                    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorRef } } },
                    403: { description: 'Forbidden', content: { 'application/json': { schema: errorRef } } },
                    404: { description: 'Building not found', content: { 'application/json': { schema: errorRef } } }
                }
            }
        },
        '/api/rooms/{id}': {
            get: {
                tags: ['Rooms'],
                summary: 'Sala po id',
                security: bearer,
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }
                ],
                responses: {
                    200: {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Room' }
                            }
                        }
                    },
                    400: { description: 'Walidacja', content: { 'application/json': { schema: errorRef } } },
                    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorRef } } },
                    404: { description: 'Not found', content: { 'application/json': { schema: errorRef } } }
                }
            }
        },
        '/api/reservations': {
            get: {
                tags: ['Reservations'],
                summary: 'Lista rezerwacji (USER: tylko swoje; ADMIN: wszystkie)',
                security: bearer,
                parameters: [
                    { name: 'roomId', in: 'query', schema: { type: 'integer', minimum: 1 } },
                    { name: 'buildingId', in: 'query', schema: { type: 'integer', minimum: 1 } },
                    {
                        name: 'userId',
                        in: 'query',
                        description: 'Tylko ADMIN; USER → 403',
                        schema: { type: 'integer', minimum: 1 }
                    },
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['CONFIRMED', 'CANCELLED'] } },
                    { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
                    { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
                    { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
                    { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
                    {
                        name: 'sort',
                        in: 'query',
                        schema: {
                            type: 'string',
                            enum: [
                                'startTime',
                                '-startTime',
                                'createdAt',
                                '-createdAt',
                                'participants',
                                '-participants'
                            ]
                        }
                    }
                ],
                responses: {
                    200: {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/ReservationDetails' }
                                        },
                                        meta: {
                                            type: 'object',
                                            properties: {
                                                page: { type: 'integer' },
                                                limit: { type: 'integer' },
                                                total: { type: 'integer' },
                                                totalPages: { type: 'integer' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: 'Walidacja', content: { 'application/json': { schema: errorRef } } },
                    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorRef } } },
                    403: { description: 'userId filter tylko dla ADMIN', content: { 'application/json': { schema: errorRef } } }
                }
            },
            post: {
                tags: ['Reservations'],
                summary: 'Utwórz rezerwację (userId z tokenu)',
                security: bearer,
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['roomId', 'participants', 'startTime', 'endTime'],
                                additionalProperties: false,
                                properties: {
                                    roomId: { type: 'integer', minimum: 1 },
                                    participants: { type: 'integer', minimum: 1 },
                                    startTime: { type: 'string', format: 'date-time' },
                                    endTime: { type: 'string', format: 'date-time' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'Utworzono',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Reservation' }
                            }
                        }
                    },
                    400: { description: 'Walidacja / reguły czasu', content: { 'application/json': { schema: errorRef } } },
                    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorRef } } },
                    404: { description: 'Room not found', content: { 'application/json': { schema: errorRef } } },
                    409: { description: 'Kolizja / pojemność', content: { 'application/json': { schema: errorRef } } }
                }
            }
        },
        '/api/reservations/{id}': {
            get: {
                tags: ['Reservations'],
                summary: 'Szczegóły (właściciel lub ADMIN; obcy USER → 404)',
                security: bearer,
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }
                ],
                responses: {
                    200: {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ReservationDetails' }
                            }
                        }
                    },
                    400: { description: 'Walidacja', content: { 'application/json': { schema: errorRef } } },
                    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorRef } } },
                    404: { description: 'Not found / brak dostępu', content: { 'application/json': { schema: errorRef } } }
                }
            }
        },
        '/api/reservations/{id}/cancel': {
            patch: {
                tags: ['Reservations'],
                summary: 'Anuluj (właściciel lub ADMIN; obcy USER → 404)',
                security: bearer,
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }
                ],
                responses: {
                    200: {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Reservation' }
                            }
                        }
                    },
                    400: { description: 'Walidacja', content: { 'application/json': { schema: errorRef } } },
                    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorRef } } },
                    404: { description: 'Not found / brak dostępu', content: { 'application/json': { schema: errorRef } } },
                    409: { description: 'Już rozpoczęta / zły status', content: { 'application/json': { schema: errorRef } } }
                }
            }
        }
    }
};

export { openApiSpec };
