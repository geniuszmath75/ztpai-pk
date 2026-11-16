function registerEventListeners({
    eventBus,
    auditLogRepository,
    authRepository,
    logger = console
}) {
    eventBus.on('reservation.created', (payload) =>
        auditLogRepository.create({
            eventType: 'reservation.created',
            payload
        })
    );

    eventBus.on('reservation.cancelled', async (payload) => {
        await auditLogRepository.create({
            eventType: 'reservation.cancelled',
            payload
        });
    });

    eventBus.on('reservation.cancelled', async (payload) => {
        if (payload.cancelledByRole !== 'ADMIN' || payload.cancelledBy === payload.userId) {
            return;
        }

        const owner = await authRepository.findById(payload.userId);
        logger.log(
            `[notification] to: ${owner?.email ?? 'unknown'} reservation ${payload.reservationId} cancelled`
        );
    });
}

export { registerEventListeners };
