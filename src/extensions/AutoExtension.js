const util = require("util");
const DiscordJS = require("discord.js");
const Extension = require("../hooks/Extension");
const Misc = require("../primitives/Misc");
const Command = require("../commands/Command");

class AutoExtension extends Extension {
    /**
     * @param {Host} host
     */
    constructor(host) {
        super(host);
        this.onMessageBind = this.onMessage.bind(this);
    }

    static get id() { return "auto"; }

    /**
     * @param {DiscordJS.Message} message
     */
    onMessage(message) {
        if (message.content.indexOf("<:fishpat:569550777455214602>") !== -1) {
            if (Math.random() > 0.9)
                this.clientManager.send(message.channel, new DiscordJS.Attachment("https://cdn.discordapp.com/emojis/569550777455214602.png"))
            else
                this.clientManager.send(message.channel, "<:fishpat:569550777455214602>");
            return true;
        }
        return false;
    }

    onStart() {
        this.host.messageHandler.appendChained(this.onMessageBind);
    }
    onStop() {
        this.host.messageHandler.removeChained(this.onMessageBind);
    }
}

module.exports = AutoExtension;

const Host = require("../Host");
