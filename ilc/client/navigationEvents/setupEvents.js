let navigationHook;
let currentUrl = window.location.href;

const capturedEventListeners = {
    hashchange: [],
    popstate: [],
};

const routingEventsListeningTo = [
    'hashchange',
    'popstate'
];

const addEventListener = window.addEventListener;
const removeEventListener = window.removeEventListener;

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
        routingEventsListeningTo.includes(eventName) &&
        !capturedEventListeners[eventName].includes(fn)
    ) {
        capturedEventListeners[eventName].push(fn);
        return;
    }

    return addEventListener.apply(this, arguments);
}

function patchedRemoveEventListener(eventName, fn) {
    if (typeof fn === "function" && routingEventsListeningTo.includes(eventName)) {
        capturedEventListeners[eventName] = capturedEventListeners[eventName].filter((listener) => listener !== fn);
        return;
    }

    return removeEventListener.apply(this, arguments);
}

function fireRoutingEvent() {
    window.dispatchEvent(new CustomEvent('ilc:before-routing'));
}

function setupNavigationHook(hook) {
    navigationHook = hook;
}

function patchedUpdateState(updateState) {
    return function (state, title, url, ...rest) {
        const {
            navigationShouldBeCanceled,
            newUrl,
        } = navigationHook(url);

        if (navigationShouldBeCanceled) {
            return;
        }

        const urlBefore = window.location.href;
        const result = updateState.call(this, state, title, newUrl, ...rest);
        const urlAfter = window.location.href;

        if (urlBefore !== urlAfter) {
            fireRoutingEvent();
        }

        return result;
    };
}

function handlePopState(event) {
    const oldUrl = currentUrl;
    const newUrl = (currentUrl = window.location.href);

    if (!event.singleSpa && navigationHook(newUrl).navigationShouldBeCanceled) {
        window.history.replaceState(null, undefined, oldUrl);
        return;
    }

    callCapturedEventListeners(arguments);
}

addEventListener('hashchange', handlePopState);
addEventListener('popstate', handlePopState);

window.addEventListener = patchedAddEventListener;
window.removeEventListener = patchedRemoveEventListener;

// We will trigger an app change for any routing events
window.addEventListener('hashchange', fireRoutingEvent);
window.addEventListener('popstate', fireRoutingEvent);

window.history.pushState = patchedUpdateState(window.history.pushState);
window.history.replaceState = patchedUpdateState(window.history.replaceState);

export default setupNavigationHook;
