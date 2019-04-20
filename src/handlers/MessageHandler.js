const Handler = require("../hooks/Handler");

/**
 * @typedef {(message: DiscordJS.Message) => boolean} MessageCallback
 */

class MessageHandler extends Handler {
    /**
     * @param {Host} host
     */
    constructor(host) {
        super(host);
        this.onMessageBind = this.onMessage.bind(this);

        /** @type {MessageCallback[]} */
        this.callbacks = [];
        this.lastMessageTime = this.host.time;
    }

    static get id() { return "hmessages"; }

    /**
     * @param {MessageCallback[]} callbacks
     */
    add(...callbacks) {
        this.callbacks.push(...callbacks);
    }
    /**
     * @param {MessageCallback[]} callbacks
     */
    remove(...callbacks) {
        for (let callback of callbacks) {
            const index = this.callbacks.indexOf(callback);
            if (index !== -1) this.callbacks.splice(index, 1);
        }
    }

    /**
     * @param {DiscordJS.Message} message
     */
    onMessage(message) {
        if (message.author.bot) return;
        if (message.channel.type != "text") return;
        this.lastMessageTime = this.host.time;
        for (let callback of this.callbacks)
            if (callback(message)) break;
    }

    onStart() {
        this.host.client.on("message", this.onMessageBind);
    }
    onStop() {
        this.host.client.off("message", this.onMessageBind);
    }
}

module.exports = MessageHandler;

const Host = require("../Host");
const DiscordJS = require("discord.js");
