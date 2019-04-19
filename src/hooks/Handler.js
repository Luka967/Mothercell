const Hook = require("./Hook");

class Handler extends Hook {
    /**
     * @param {Host} host
     */
    constructor(host) {
        super(host);
    }
}

module.exports = Handler;

const Host = require("../Host");
