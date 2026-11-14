const { EventEmitter } = require("node:events");

// Asynchronous wrapper around EventEmitter isolating listeners so handler failures never break API responses
function createEventBus() {
    const emitter = new EventEmitter();

    return {
        publish(eventName, payload) {
            emitter.emit(eventName, {
                name: eventName,
                occurredAt: new Date().toISOString(),
                payload
            });
        },

        subscribe(eventName, handler) {
            emitter.on(eventName, event => {
                Promise.resolve()
                    .then(() => handler(event))
                    .catch(err => console.error(`[event:${eventName}] handler failed`, err));
            });
        }
    };
}

// Null Object implementation used as default when no event bus is injected
const noopEventBus = {
    publish() {},
    subscribe() {}
};

module.exports = { createEventBus, noopEventBus };
