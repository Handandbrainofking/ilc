function shouldNavigateTo(url) {
    return require('../GuardManager')().shouldNavigateTo(url)
}

function fireRoutingEvent() {
    window.dispatchEvent(new CustomEvent('ilc:before-routing'));
}

function patchedUpdateState(updateState) {
    return function (state, title, url, ...rest) {
        if (!shouldNavigateTo(url)) {
            return;
        }

        const urlBefore = window.location.href;
        const urlProcessor = require('../getIlcUrlProcessor')();
        const urlAfterProcessing = url ? urlProcessor.process(url) : url;
        const result = updateState.call(this, state, title, urlAfterProcessing, ...rest);
        const urlAfter = window.location.href;

        if (urlBefore !== urlAfter) {
            fireRoutingEvent();
        }

        return result;
    };
}

let currentUrl = window.location.href;

function handlePopState(event) {
    const oldUrl = currentUrl;
    const newUrl = (currentUrl = window.location.href);

    if (event.singleSpa || shouldNavigateTo(newUrl)) {
        window.callCapturedEventListeners(arguments);
        return;
    }

    window.history.replaceState(null, undefined, oldUrl);
}

window.setEventListener('hashchange', handlePopState);
window.setEventListener('popstate', handlePopState);

// We will trigger an app change for any routing events
window.addEventListener('hashchange', fireRoutingEvent);
window.addEventListener('popstate', fireRoutingEvent);

window.history.pushState = patchedUpdateState(window.history.pushState);
window.history.replaceState = patchedUpdateState(window.history.replaceState);
