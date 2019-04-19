const Hook = require("./Hook");

class Extension extends Hook {
    /**
     * @param {Host} host
     */
    constructor(host) {
        super(host);
    }
}

module.exports = Extension;

const Host = require("../Host");
