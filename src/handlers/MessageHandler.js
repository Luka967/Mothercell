const Handler = require("../hooks/Handler");

/**
 * @typedef {(message: DiscordJS.Message) => boolean} ChainedMessageCallback
 * @typedef {(message: DiscordJS.Message) => void} PureMessageCallback
 */

class MessageHandler extends Handler {
    /**
     * @param {Host} host
     */
    constructor(host) {
        super(host);
        this.onMessageBind = this.onMessage.bind(this);

        /** @type {ChainedMessageCallback[]} */
        this.chained = [];
        /** @type {MessageCallback[]} */
        this.pure = [];
        this.lastMessageTime = this.host.preciseTime;
    }

    static get id() { return "hmessages"; }

    /**
     * @param {ChainedMessageCallback[]} callbacks
     */
    appendChained(...callbacks) {
        this.chained.unshift(...callbacks);
    }
    /**
     * @param {ChainedMessageCallback[]} callbacks
     */
    addChained(...callbacks) {
        this.chained.push(...callbacks);
    }
    /**
     * @param {PureMessageCallback[]} callbacks
     */
    addPure(...callbacks) {
        this.pure.push(...callbacks);
    }
    /**
     * @param {ChainedMessageCallback[]} callbacks
     */
    removeChained(...callbacks) {
        for (let callback of callbacks) {
            const index = this.chained.indexOf(callback);
            if (index !== -1) this.chained.splice(index, 1);
        }
    }
    /**
     * @param {PureMessageCallback[]} callbacks
     */
    removePure(...callbacks) {
        for (let callback of callbacks) {
            const index = this.pure.indexOf(callback);
            if (index !== -1) this.pure.splice(index, 1);
        }
    }

    /**
     * @param {DiscordJS.Message} message
     */
    onMessage(message) {
        if (message.author.bot) return;
        if (message.channel.type != "text") return;
        this.lastMessageTime = this.host.preciseTime;
        for (let callback of this.pure)
            callback(message);
        for (let callback of this.chained)
            if (callback(message)) break;
    }

    onStart() {
        this.host.client.on("message", this.onMessageBind);
    }
    onStop() {
        this.host.client.removeListener("message", this.onMessageBind);
    }
}

module.exports = MessageHandler;

const Host = require("../Host");
const DiscordJS = require("discord.js");
