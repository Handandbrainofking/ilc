const getIlcConfig = require('./ilcConfig');
const UrlProcessor = require('../common/UrlProcessor');

let urlProcessor;

module.exports = () => {
    if (urlProcessor === undefined) {
        const registryConf = getIlcConfig();
        urlProcessor = new UrlProcessor(registryConf.settings.trailingSlash);
    }

    return urlProcessor;
};
