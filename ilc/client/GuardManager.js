import actionTypes from '../common/guard/actionTypes';

export default class GuardManager {
    #router;
    #transitionHooksPlugin;

    constructor(router, pluginManager) {
        this.#router = router;
        this.#transitionHooksPlugin = pluginManager.getTransitionHooksPlugin();
    }

    hasAccessTo(url) {
        if (this.#transitionHooksPlugin === null) {
            return true;
        }

        const route = this.#router.match(url);

        if (route.specialRole === null) {
            for (const hook of this.#transitionHooksPlugin.getTransitionHooks()) {
                const action = hook({
                    route: {...route, url},
                    navigate: this.#router.navigateToUrl,
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
