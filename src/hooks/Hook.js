class Hook {
    /**
     * @param {Host} host
     */
    constructor(host) {
        this.host = host;
    }

    get client() { return this.host.client; }
    get clientManager() { return this.host.clientManager; }
    get logger() { return this.host.logger; }
    get settings() { return this.host.settings; }

    /** @type {string} */
    static get id() { throw new Error("Must be overriden"); }
    /** @type {string} */
    get id() { return this.constructor.id; }

    /**
     * @template T
     * @param {T} defaultData
     */
    getData(defaultData) {
        return this.host.dataHandler.get(this.id, defaultData);
    }
    /**
     * @template T
     * @param {T} data
     */
    setData(data) {
        return this.host.dataHandler.set(this.id, data);
    }
    flushData() {
        return this.host.dataHandler.flush(this.id);
    }

    onStart() { }
    onStop() { }
}

module.exports = Hook;

const Host = require("../Host");
