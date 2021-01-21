const navigateToUrl = require('single-spa').navigateToUrl;
const unlocalizeUrl = require('../common/i18n/unlocalizeUrl');

const actionTypes = require('../common/guard/actionTypes');

const getIlcRouter = require('./getIlcRouter');
const getIlcConfig = require('./ilcConfig');

class GuardManager {
    #registryConf;
    #router;
    #unlocalizeUrl;
    #navigateToUrl;
    #transitionHooksPlugin;

    constructor(
        registryConf,
        router,
        unlocalizeUrl,
        navigateToUrl,
        transitionHooksPlugin,
    ) {
        this.#registryConf = registryConf;
        this.#router = router;
        this.#unlocalizeUrl = unlocalizeUrl;
        this.#navigateToUrl = navigateToUrl;
        this.#transitionHooksPlugin = transitionHooksPlugin;
    }

    shouldNavigateTo(url) {
        const pathname = new URL(url, 'http://hack').pathname;
        const route = this.#router.match(this.#unlocalizeUrl(this.#registryConf.settings.i18n, pathname));
        const hooks = this.#transitionHooksPlugin.getTransitionHooks();

        if (route.specialRole == null) {
            for (const hook of hooks) {
                const action = hook({
                    route: {
                        ...route,
                        url,
                    },
                    navigate: this.#navigateToUrl,
                });

                switch(action.type) {
                    case actionTypes.stopNavigation: return false;
                    case actionTypes.continue:
                    default: break;
                }
            }
        }

        return true;
    }
};

let guardManager;

module.exports = () => {
    if (guardManager === undefined) {
        const router = getIlcRouter();
        const registryConf = getIlcConfig();
        const transitionHooksPlugin = {
            getTransitionHooks: () => [
                () => ({type: actionTypes.continue}),
                () => ({type: actionTypes.continue}),
                () => ({type: actionTypes.continue}),
                () => ({type: actionTypes.continue}),
                ({
                    route,
                    navigate,
                }) => {
                    const Cookies = require('js-cookie');
                    const cookieName = 'ilc-test-guard-cookie';

                    if (Cookies.get(cookieName)) {
                        return {type: actionTypes.continue};
                    }

                    if (!route.meta.protected) {
                        return {type: actionTypes.continue};
                    }

                    const promise = new Promise((resolve, reject) => {
                        // const yes = window.confirm('Yes?');
                        // resolve({
                        //     yes,
                        // });

                        setTimeout(() => resolve({
                            yes: true,
                        }), 5000);
                    });

                    promise.then(res => {
                        if (res.yes) {
                            Cookies.set(cookieName, 'true');
                            navigate(route.url);
                        }
                    });

                    return {type: actionTypes.stopNavigation};
                },
            ],
        };

        guardManager = new GuardManager(registryConf, router, unlocalizeUrl, navigateToUrl, transitionHooksPlugin);
    }

    return guardManager;
};
module.exports.GuardManager = GuardManager;
