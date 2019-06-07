const Misc = require("../primitives/Misc");
const Handler = require("../hooks/Handler");
const CommandList = require("../commands/CommandList");
const Setting = require("../settings/Setting");

/** @type {HCommandsSavedData} */
const defaultData = { };

class CommandHandler extends Handler {
    /**
     * @param {Host} host
     */
    constructor(host) {
        super(host);
        this.onMessageBind = this.onMessage.bind(this);
        this.commandList = new CommandList();

        this.guildSettings = this.getData(defaultData);
    }

    static get id() { return "hcommands"; }

    /**
     * @param {DiscordJS.Guild} guild
     */
    getGuildSettings(guild) {
        let value;
        if (guild.id in this.guildSettings)
            value = this.guildSettings[guild.id];
        else {
            value = this.guildSettings[guild.id] = {
                prefix: null,
                blacklistRoles: [],
                whitelistChannels: [],
                whitelistRoles: []
            };
            this.flushData();
        }
        return value;
    }

    /**
     * @param {DiscordJS.GuildMember} guildMember
     */
    canEditSettings(guildMember) {
        const guildSettings = this.getGuildSettings(guildMember.guild);
        return guildMember.hasPermission("MANAGE_GUILD", true, true, true) ||
            guildMember.roles.filter(v => guildSettings.whitelistRoles.indexOf(v.id) !== -1).size > 0;
    }

    /**
     * @param {DiscordJS.Message} message
     */
    onMessage(message) {
        const guildSettings = this.getGuildSettings(message.guild);
        const guildMember = message.guild.member(message.author);

        if (message.content === `<@${this.client.user.id}>` && guildSettings.prefix !== null) {
            this.clientManager.respond(message.channel, "greet", "my prefix is `$1`", guildSettings.prefix);
            return true;
        }

        let command, hitPrefix;
        if (guildSettings.prefix !== null && message.content.startsWith(guildSettings.prefix))
            hitPrefix = guildSettings.prefix;
        else if (message.content.startsWith(this.client.user.toString()))
            hitPrefix = this.client.user.toString();
        else hitPrefix = false;

        if (!hitPrefix || message.content.length === hitPrefix.length) return false;

        const allowedAnywhere =
            guildMember.hasPermission("MANAGE_GUILD", true, true, true) ||
            guildMember.roles.filter(v => guildSettings.whitelistRoles.indexOf(v.id) !== -1).size > 0;
        const forbiddenHere =
            guildSettings.whitelistChannels.indexOf(message.channel.id) === -1;
        if (!allowedAnywhere && forbiddenHere) {
            this.clientManager.prevent(message, "fail", Misc.HCOMMANDS_CANNOT_USE);
            return true;
        }

        command = message.content.slice(hitPrefix.length).split(/\r\n|\r|\n/).join("").trim().split(" ");
        const name = command[0];
        const args = command.slice(1);
        if (!this.commandList.execute(name, this.host, message, args))
            this.clientManager.respond(message.channel, "fail", Misc.HCOMMANDS_UNKNOWN, name);

        return true;
    }

    onStart() {
        this.host.messageHandler.addChained(this.onMessageBind);
        this.host.settingsHandler.settingList.add(...settings);
    }
    onStop() {
        this.host.messageHandler.removeChained(this.onMessageBind);
        this.host.settingsHandler.settingList.remove(...settings);
    }
}

const settings = [
    new Setting(CommandHandler, "commands.prefix", false,
        (host, source) => {
            return host.commandHandler.getGuildSettings(source.guild).prefix;
        },
        (host, source, value) => {
            if (!host.commandHandler.canEditSettings(source.guild.member(source.author)))
                return { success: false, message: Misc.NO_PERMISSION };

            if (typeof value !== "string")
                return { success: false, message: Misc.VALUE_MUST_BE_STRING };
            if (value.length === 0)
                return { success: false, message: Misc.VALUE_MUST_BE_NONEMPTY_STRING };

            host.commandHandler.getGuildSettings(source.guild).prefix = value;
            host.commandHandler.flushData();
            return { success: true };
        }
    ),
    new Setting(CommandHandler, "commands.allowedchannels", true,
        (host, source) => {
            return host.commandHandler.getGuildSettings(source.guild).whitelistChannels;
        },
        (host, source, value) => {
            if (!host.commandHandler.canEditSettings(source.guild.member(source.author)))
                return { success: false, message: Misc.NO_PERMISSION };

            if (!(value instanceof Array))
                return { success: false, message: Misc.VALUE_MUST_BE_ARRAY };
            for (let channelID of value) {
                if (typeof channelID !== "string")
                    return { success: false, message: Misc.VALUE_MUST_BE_STRINGS };
                if (!source.guild.channels.has(channelID))
                    return { success: false, message: Misc.format(Misc.VALUE_CHANNEL_NOEX, channelID) };
            }

            host.commandHandler.getGuildSettings(source.guild).whitelistChannels = value;
            host.commandHandler.flushData();
            return { success: true };
        }
    ),
    new Setting(CommandHandler, "commands.forbiddenroles", true,
        (host, source) => {
            return host.commandHandler.getGuildSettings(source.guild).blacklistRoles;
        },
        (host, source, value) => {
            if (!host.commandHandler.canEditSettings(source.guild.member(source.author)))
                return { success: false, message: Misc.NO_PERMISSION };

            if (!(value instanceof Array))
                return { success: false, message: Misc.VALUE_MUST_BE_ARRAY };
            for (let roleID of value) {
                if (typeof roleID !== "string")
                    return { success: false, message: Misc.VALUE_MUST_BE_STRINGS };
                if (!source.guild.roles.has(roleID))
                    return { success: false, message: Misc.format(Misc.VALUE_ROLE_NOEX, roleID) };
            }
            host.commandHandler.getGuildSettings(source.guild).blacklistRoles = value;
            host.commandHandler.flushData();
            return { success: true };
        }
    ),
    new Setting(CommandHandler, "commands.overrideroles", true,
        (host, source) => {
            return host.commandHandler.getGuildSettings(source.guild).whitelistRoles;
        },
        (host, source, value) => {
            if (!host.commandHandler.canEditSettings(source.guild.member(source.author)))
                return { success: false, message: Misc.NO_PERMISSION };

            if (!(value instanceof Array))
                return { success: false, message: Misc.VALUE_MUST_BE_ARRAY };
            for (let roleID of value) {
                if (typeof roleID !== "string")
                    return { success: false, message: Misc.VALUE_MUST_BE_STRINGS };
                if (!source.guild.roles.has(roleID))
                    return { success: false, message: Misc.format(Misc.VALUE_ROLE_NOEX, roleID) };
            }
            host.commandHandler.getGuildSettings(source.guild).whitelistRoles = value;
            host.commandHandler.flushData();
            return { success: true };
        }
    )
];

module.exports = CommandHandler;

const Host = require("../Host");
const DiscordJS = require("discord.js");
