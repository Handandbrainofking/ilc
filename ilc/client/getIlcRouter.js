const getIlcConfig = require('./ilcConfig');
const Router = require('../common/router/Router');

let router;

module.exports = () => {
    if (router === undefined) {
        const registryConf = getIlcConfig();
        router = new Router(registryConf);
    }

    return router;
};
