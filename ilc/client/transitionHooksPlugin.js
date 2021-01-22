import actionTypes from '../common/guard/actionTypes';

export default {
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
}
