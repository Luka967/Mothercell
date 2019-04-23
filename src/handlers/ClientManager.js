const DiscordJS = require("discord.js");

const Handler = require("../hooks/Handler");
const Misc = require("../primitives/Misc");

/**
 * message 1 guild owner 2 user 3 channel 4 guild 5
 * @param {DiscordJS.User | DiscordJS.Message | DiscordJS.TextChannel | DiscordJS.DMChannel | DiscordJS.Guild} item
 */
function extractElements(item) {
    if (item instanceof DiscordJS.Message)      return [ item, item.guild.owner , item.author   , item.channel  , item.guild ];
    if (item instanceof DiscordJS.TextChannel)  return [ null, item.guild.owner , null          , item          , item.guild ];
    if (item instanceof DiscordJS.DMChannel)    return [ null, null             , item.recipient, item          , null       ];
    if (item instanceof DiscordJS.User)         return [ null, null             , item          , null          , null       ];
    if (item instanceof DiscordJS.Guild)        return [ null, item.owner       , null          , null          , item       ];
}

/**
 * @type {{ [APIcode: number]: { [botAction: number]: string | 0 | -1 } }}
 */
const codes = {
    50001: { // Missing access
        1: 0,
        2: "I could not send a message in $4 when needed",
        3: "I could not send an embed message in $4 when needed",
        4: "I could not delete a message in $4 when needed"
    },
    50007: { // Cannot send messages to this user
        1: 0
    },
    50013: { //	Missing permissions
        2: "I did not have permissions to send a message to $4 when needed",
        3: "I did not have permissions to send an embed message in $4 when needed",
        4: "I did not have permissions to delete a message in $4 when needed"
    },
    50035: { // Invalid Form Body
        2: -1,
        3: -1
    }
};

class ClientManager extends Handler {
    /**
     * @param {Host} host
     */
    constructor(host) {
        super(host);

        this.bound = {
            error: this.onClientError.bind(this)
        };
        this.specialBound = {
            ready: this.onClientReady.bind(this),
            disconnect: this.onClientDisconnect.bind(this),
            reconnecting: this.onClientReconnecting.bind(this)
        };
    }

    static get id() { return "mclient"; }

    /**
     * @param {DiscordJS.DiscordAPIError} e
     * @param {DiscordJS.User | DiscordJS.Message | DiscordJS.TextChannel | DiscordJS.DMChannel | DiscordJS.Guild} item
     * @param {number} action
     */
    handleError(e, item, action) {
        const err = new Error(`${e.message}\naction: ${action}, code: ${e.code}`);
        if (!(e.code in codes)) throw err;
        if (!(action in codes[e.code])) throw err;
        if (codes[e.code][action] === -1) throw err;
        if (codes[e.code][action] === 0) return;
        const elements = extractElements(item);
        const content = Misc.format(`${Misc.emotes.info} ${codes[e.code][action]}`, ...elements);
        elements[1].createDM()
            .then(v => v.send(content))
            .catch(ee => this.handleError(ee, elements[1], Misc.ACTION_SEND_DM));
    }
    /**
     * @param {DiscordJS.TextChannel | DiscordJS.DMChannel | DiscordJS.GroupDMChannel} channel
     * @param {string} message
     * @param {any[]} format
     */
    send(channel, message, ...format) {
        return channel.send(Misc.format(message, ...format))
            .catch(
                e => this.handleError(e, channel, Misc.ACTION_SEND_MESSAGE_GUILD)
            )
            .catch(Misc.throw);
    }
    /**
     * @param {DiscordJS.TextChannel | DiscordJS.DMChannel | DiscordJS.GroupDMChannel} channel
     * @param {DiscordJS.Attachment | DiscordJS.RichEmbed} embed
     */
    sendEmbed(channel, embed) {
        return channel.send(embed)
            .catch(
                e => this.handleError(e, channel, Misc.ACTION_SEND_EMBED_GUILD)
            )
            .catch(Misc.throw);
    }

    /**
     * @param {DiscordJS.Message} source
     * @param {keyof Misc["emotes"]} emote
     * @param {string} message
     * @param {any[]} format
     */
    prevent(source, emote, message, ...format) {
        const emoji = Misc.emotes[emote];
        const mention = source.author.toString();
        const messageFormat = `${emoji} ${message} ${mention}`;
        return source.delete()
            .then(
                v => source.channel.send(Misc.format(messageFormat, ...format)),
                e => this.handleError(e, source.channel, Misc.ACTION_DELETE_MESSAGE_GUILD)
            )
            .then(
                v => v.delete(5000),
                e => this.handleError(e, source.channel, Misc.ACTION_SEND_MESSAGE_GUILD)
            )
            .catch(Misc.throw);
    }

    /**
     * @param {DiscordJS.TextChannel} channel
     * @param {keyof Misc["emotes"]} emote
     * @param {string} message
     * @param {any[]} format
     */
    respond(channel, emote, message, ...format) {
        const emoji = Misc.emotes[emote];
        const messageFormat = `${emoji} ${message}`;
        return channel.send(Misc.format(messageFormat, ...format))
            .catch(
                e => this.handleError(e, channel, Misc.ACTION_SEND_MESSAGE_GUILD)
            )
            .catch(Misc.throw);
    }
    /**
     * @param {DiscordJS.TextChannel} channel
     * @param {DiscordJS.Attachment | DiscordJS.RichEmbed} message
     */
    respondEmbed(channel, message) {
        return channel.send(message)
            .catch(
                e => this.handleError(e, channel, Misc.ACTION_SEND_EMBED_GUILD)
            )
            .catch(Misc.throw);
    }

    onClientReady() {
        this.ready = true;
        this.host.ticker.start();
        this.logger.debug("ticker start");
        this.logger.inform("ready");

        this.client.once("disconnect", this.specialBound.disconnect);
        this.client.user.setPresence(this.settings.hostPresence)
            .catch(Misc.throw);
    }
    onClientError(e) {
        throw e;
    }
    onClientDisconnect() {
        this.host.ready = false;
        this.host.ticker.stop();
        this.logger.debug("ticker stop");
        if (!this.host.running) return;
        this.client.once("reconnecting", this.specialBound.reconnecting);
        this.logger.warn("disconnected");
    }
    onClientReconnecting() {
        this.client.once("ready", this.specialBound.ready);
        this.logger.debug("reconnecting");
    }

    onStart() {
        for (let eventName in this.bound)
            this.client.on(eventName, this.bound[eventName]);

        this.client.once("ready", this.specialBound.ready);
        this.client.login(this.settings.hostToken)
            .catch(Misc.throw);
    }
    onStop() {
        for (let eventName in this.bound)
            this.client.removeListener(eventName, this.bound[eventName]);

        this.client.destroy()
            .catch(Misc.throw);
    }
}

module.exports = ClientManager;

const Host = require("../Host");
