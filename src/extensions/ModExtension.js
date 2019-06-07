const util = require("util");
const DiscordJS = require("discord.js");
const Extension = require("../hooks/Extension");
const Misc = require("../primitives/Misc");
const Command = require("../commands/Command");
const Setting = require("../settings/Setting");

// /** @type {HCommandsSavedData} */
const defaultData = { };

class ModExtension extends Extension {
    /**
     * @param {Host} host
     */
    constructor(host) {
        super(host);
        this.onMessageBind = this.onMessage.bind(this);

        this.guildSettings = this.getData(defaultData);
    }

    static get id() { return "mod"; }

    /**
     * @param {DiscordJS.Guild} guild
     */
    getGuildInfo(guild) {
        let value;
        if (guild.id in this.guildSettings)
            value = this.guildSettings[guild.id];
        else {
            value = this.guildSettings[guild.id] = {
                modChannel: null,
            };
            this.flushData();
        }
        return value;
    }

    /**
     * @param {DiscordJS.GuildMember} guildMember
     */
    canEditSettings(guildMember) {
        const commandGuildSettings = this.host.commandHandler.getGuildSettings(guildMember.guild);
        return guildMember.hasPermission("MANAGE_GUILD", true, true, true) ||
            guildMember.roles.filter(v => commandGuildSettings.whitelistRoles.indexOf(v.id) !== -1).size > 0;
    }

    /**
     * @param {DiscordJS.Message} message
     */
    onMessage(message) {
        return false;
    }

    onStart() {
        this.host.commandHandler.commandList.add(...commands);
    }
    onStop() {
        this.host.commandHandler.commandList.remove(...commands);
    }
}

const commands = [

];

const settings = [

];

module.exports = ModExtension;

const Host = require("../Host");
