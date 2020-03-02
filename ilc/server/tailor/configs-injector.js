const _ = require('lodash');
const urljoin = require('url-join');
const newrelic = require('newrelic');

module.exports = class ConfigsInjector {
    #registry;
    #cdnUrl;

    constructor(registry, cdnUrl = null) {
        this.#registry = registry;
        this.#cdnUrl = cdnUrl;
    }


    async inject(document) {
        if (typeof document !== 'string' || document.indexOf('<head>') === -1 || document.indexOf('</body>') === -1) {
            throw new Error(`Can't inject ILC configs into invalid document.`);
        }

        const registryConf = await this.#registry.getConfig();

        const regConf = registryConf.data;

        const tpl =
            this.#getSPAConfig(regConf) +
            this.#wrapWithScriptTag(this.#getClientjsUrl());

        document = document.replace('</body>', this.#wrapWithIgnoreDuringParsing(tpl) + '</body>');

        document = document.replace(
            '<head>',
            '<head>' + this.#wrapWithIgnoreDuringParsing(
                this.#getPolyfill(),
                this.#wrapWithScriptTag(this.#getSystemjsUrl()),
                newrelic.getBrowserTimingHeader(),
            )
        );

        return document;
    }

    getAssetsToPreload = () => {
        return {
            scriptRefs: [this.#getSystemjsUrl(), this.#getClientjsUrl()]
        };
    };

    #getPolyfill = () =>
        `<script type="text/javascript">
            if (!(
                typeof window.URL === 'function' &&
                Object.entries &&
                Object.assign &&
                Object.fromEntries &&
                Array.from &&
                DocumentFragment.prototype.append &&
                Element.prototype.append &&
                Element.prototype.remove
            )) {
                document.write('<script src="${this.#getPolyfillUrl()}" type="text/javascript" ${this.#cdnUrl !== null ? 'crossorigin' : ''}></scr' + 'ipt>');
            }
        </script>`;

    #getSystemjsUrl = () => this.#cdnUrl === null ? '/_ilc/system.js' : urljoin(this.#cdnUrl, '/system.js');
    #getClientjsUrl = () => this.#cdnUrl === null ? '/_ilc/client.js' : urljoin(this.#cdnUrl, '/client.js');
    #getPolyfillUrl = () => this.#cdnUrl === null ? '/_ilc/polyfill.min.js' : urljoin(this.#cdnUrl, '/polyfill.min.js');

    #getSPAConfig = (registryConf) => {
        registryConf.apps = _.mapValues(registryConf.apps, v => _.pick(v, ['spaBundle', 'cssBundle', 'dependencies', 'props', 'initProps', 'kind']));

        return `<script type="spa-config">${JSON.stringify(_.omit(registryConf, ['templates']))}</script>`;
    };

    #wrapWithScriptTag = (url) => {
        const crossorigin = this.#cdnUrl !== null ? 'crossorigin' : '';

        return `<script src="${url}" type="text/javascript" ${crossorigin}></script>`;
    };

    #wrapWithIgnoreDuringParsing = (...content) => `<!-- TailorX: Ignore during parsing START -->${content.join('')}<!-- TailorX: Ignore during parsing END -->`;
};