import { EventEmitter } from 'node:events';

function createEventBus({ logger = console } = {}) {
    const emitter = new EventEmitter();

    return {
        on(eventName, listener) {
            emitter.on(eventName, listener);
        },

        async publish(eventName, payload) {
            const listeners = emitter.listeners(eventName);
            await Promise.all(
                listeners.map((listener) =>
                    Promise.resolve()
                        .then(() => listener(payload))
                        .catch((error) => {
                            logger.error(`Event listener failed: ${eventName}`, error);
                        })
                )
            );
        }
    };
}

export { createEventBus };
