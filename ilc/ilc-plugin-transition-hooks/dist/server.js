const actionTypes = {
    continue: 'continue',
    redirect: 'redirect',
};

module.exports = {
    type: 'transitionHooks',
    getTransitionHooks: () => [
        async ({route,req}) => {return {type: actionTypes.continue};},
        async ({route,req}) => {return {type: actionTypes.continue};},
        async ({route,req}) => {return {type: actionTypes.continue};},
        async ({route,req}) => {return !route.meta.protected ? {type: actionTypes.continue} : {type: actionTypes.redirect, newLocation: '/planets'};},
        // async ({route,req}) => {throw new Error('Should redirect to 500 page error');},
    ],
};
