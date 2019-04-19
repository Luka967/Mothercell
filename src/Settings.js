module.exports = Object.seal({
    /** @type {string} */
    hostToken: null,
    hostTickerStep: 1000,
    hostOwner: null,
    /** @type {HostPresence} */
    hostPresence: {
        status: "online",
        game: null
    },
    dataLocation: "./data/"
});
