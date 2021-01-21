const Intl = require('ilc-sdk/app').Intl;

module.exports = (i18nConfig, url) => {
    if (!i18nConfig.enabled) {
        return url;
    }

    return Intl.parseUrl(i18nConfig, url).cleanUrl;
};
