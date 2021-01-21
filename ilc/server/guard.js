const Router = require('../common/router/Router');
const actionTypes = require('../common/guard/actionTypes');

const preHandlerFactory = (registryConfig, unlocalizeUrl, transitionHooksPlugin) => async (req, reply) => {
    const router = new Router(registryConfig);
    const route = router.match(unlocalizeUrl(registryConfig.settings.i18n, req.raw.url));
    const hooks = transitionHooksPlugin.getTransitionHooks();

    const actions = await Promise.all(hooks.map((hook) => hook({
        route,
        req: req.raw,
    })));

    for (const action of actions) {
        switch (action.type) {
            case actionTypes.redirect: {
                reply.redirect(action.newLocation);
                return;
            }
            case actionTypes.continue:
            default: break;
        }
    }
};

module.exports = {
    preHandlerFactory,
};
