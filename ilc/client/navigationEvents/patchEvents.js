const capturedEventListeners = {
    hashchange: [],
    popstate: [],
};

const routingEventsListeningTo = [
    'hashchange',
    'popstate'
];

function callCapturedEventListeners(eventArguments) {
    if (!eventArguments) {
        return;
    }

    const eventType = eventArguments[0].type;

    if (!(routingEventsListeningTo.indexOf(eventType) >= 0)) {
        return;
    }

    capturedEventListeners[eventType].forEach((listener) => {
        try {
            listener.apply(this, eventArguments);
        } catch (error) {
            setTimeout(() => {
                throw error;
            });
        }
    });
}

function patchedAddEventListener(eventName, fn) {
    if (
        typeof fn === "function" &&
        routingEventsListeningTo.indexOf(eventName) >= 0 &&
        !(capturedEventListeners[eventName].indexOf((listener) => listener === fn) >= 0)
    ) {
        capturedEventListeners[eventName].push(fn);
        return;
    }

    return window.setEventListener.apply(this, arguments);
}

function patchedRemoveEventListener(eventName, fn) {
    if (typeof fn === "function" && routingEventsListeningTo.indexOf(eventName) >= 0) {
        capturedEventListeners[eventName] = capturedEventListeners[eventName].filter((listener) => listener !== fn);
        return;
    }

    return window.unsetEventListener.apply(this, arguments);
}

window.setEventListener = window.addEventListener;
window.unsetEventListener = window.removeEventListener;

window.addEventListener = patchedAddEventListener;
window.removeEventListener = patchedRemoveEventListener;

window.callCapturedEventListeners = callCapturedEventListeners;
