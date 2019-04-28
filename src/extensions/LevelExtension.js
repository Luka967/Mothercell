const util = require("util");
const DiscordJS = require("discord.js");
const Extension = require("../hooks/Extension");
const Misc = require("../primitives/Misc");
const Command = require("../commands/Command");
const Setting = require("../settings/Setting");

/** @type {ELevelsSavedData} */
const defaultData = { guildSettings: { }, userProgress: { } };

class LevelExtension extends Extension {
    /**
     * @param {Host} host
     */
    constructor(host) {
        super(host);
        this.onMessageBind = this.onMessage.bind(this);

        this.data = this.getData(defaultData);
    }

    static get id() { return "level"; }

    /**
     * @param {DiscordJS.Guild} guild
     */
    getGuildSettings(guild) {
        let value;
        if (guild.id in this.data.guildSettings)
            value = this.data.guildSettings[guild.id];
        else {
            value = this.data.guildSettings[guild.id] = {
                enabled: false,
                blacklistChannels: [],
                blacklistRoles: []
            };
            this.flushData();
        }
        return value;
    }

    /**
     * @param {string} userID
     */
    getUserProgress(userID) {
        let value;
        if (userID in this.data.userProgress)
            value = this.data.userProgress[userID];
        else {
            value = this.data.userProgress[userID] = {
                timeout: 0,
                totalXP: 0,
                guildXP: { }
            };
            this.flushData();
        }
        return value;
    }
    /**
     * @param {string} userID
     * @param {DiscordJS.Guild=} guild
     */
    getUserLevel(userID, guild) {
        const userProgress = this.getUserProgress(userID);
        let remainderXP = guild ? userProgress.guildXP[guild.id] : userProgress.totalXP,
            passXP,
            level = 0;
        if (isNaN(remainderXP)) return null;
        while (true) {
            passXP = 50 + 50 * Math.pow(level, 1.2);
            if (remainderXP < passXP) break;
            remainderXP -= passXP;
            level++;
        }
        return {
            XP: ~~remainderXP,
            totalXP: userProgress.totalXP,
            passXP: ~~passXP,
            level: level
        };
    }
    /**
     * @param {DiscordJS.GuildMember} guildMember
     * @param {string} messageContent
     */
    awardUser(guildMember, messageContent) {
        const userProgress = this.getUserProgress(guildMember.user.id);
        userProgress.timeout = this.host.time + 1 * 1000;
        const XP = ~~(1 + Math.min(messageContent.length, 100) / 100 * 4);
        userProgress.totalXP += XP;
        userProgress.guildXP[guildMember.guild.id] = userProgress.guildXP[guildMember.guild.id] || 0;
        userProgress.guildXP[guildMember.guild.id] += XP;
        this.flushData();
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

        if (guildMember == null || !guildSettings.enabled)
            return false;
        if (guildSettings.blacklistChannels.indexOf(message.channel) !== -1)
            return false;
        for (let role of guildSettings.blacklistRoles)
            if (guildMember.roles.has(role))
                return false;

        const progress = this.getUserProgress(message.author.id);
        if (progress.timeout >= this.host.time)
            return false;

        this.awardUser(guildMember, message.content);
        return false;
    }

    onStart() {
        this.host.messageHandler.addChained(this.onMessageBind);
        this.host.commandHandler.commandList.add(...commands);
    }
    onStop() {
        this.host.messageHandler.addChained(this.onMessageBind);
        this.host.commandHandler.commandList.remove(...commands);
    }
}

const commands = [
    new Command(LevelExtension, "xp", "[user]", "display your or somebody's XP", async (host, args, message) => {
        /** @type {LevelExtension} */
        const extension = host.extensions[LevelExtension.id];

        const guildSettings = extension.getGuildSettings(message.guild);
        if (!guildSettings.enabled) {
            host.clientManager.respond(message.channel, "fail", "`level` extension is disabled in this guild");
            return;
        }
        /** @type {DiscordJS.User} */
        let user;
        if (args.length >= 1) {
            const mention = args[0];
            if (mention[0] !== "<" || mention[1] !== "@" || mention[mention.length - 1] !== ">") {
                host.clientManager.respond(message.channel, "fail", "`$1` is not an user", mention);
                return;
            }
            const viaNickname = mention[2] === "!";
            user = await host.client.fetchUser(mention.slice(viaNickname ? 3 : 2, mention.length - 1));
        } else user = message.author;
        const guildMember = message.guild.member(message.author);
        if (guildMember == null) {
            host.clientManager.respond(message.channel, "fail", "`$1` is not in this guild", user);
            return;
        }

        const userProgress = extension.getUserLevel(user.id, message.guild);
        if (userProgress === null) {
            host.clientManager.respond(message.channel, "fail", "user has no XP in this guild");
            return;
        }
        host.clientManager.respondEmbed(message.channel, Misc.embed(user, host.client.user, null, null, [
            {
                name: "Level",
                value: userProgress.level,
                inline: true
            },
            {
                name: "XP",
                value: userProgress.XP + " / " + userProgress.passXP,
                inline: true
            },
            {
                name: "Total XP",
                value: userProgress.totalXP,
                inline: true
            }
        ]));
    }),
    new Command(LevelExtension, "xpboard", "", "display the top 10 users for this guild", async (host, args, message) => {
        /** @type {LevelExtension} */
        const extension = host.extensions[LevelExtension.id];
        const guild = message.guild;
        /** @type {{ handle: string, level: number, XP: number, passXP: number, totalXP: number }[]} */
        const users = [];
        for (let userID in extension.data.userProgress) {
            const userLevel = extension.getUserLevel(userID, guild);
            if (userLevel === null) continue;
            const user = await host.client.fetchUser(userID);
            if (user == null) continue;
            users.push({
                handle: `${user.username}#${user.discriminator}`,
                level: userLevel.level,
                XP: userLevel.XP,
                passXP: userLevel.passXP,
                totalXP: userLevel.totalXP,
            });
        }
        users.sort((a, b) => b.totalXP - a.totalXP);
        const fields = [];
        for (let i = 0; i < 10 && i < users.length; i++) {
            const user = users[i];
            fields.push({
                name: Misc.format("**$1.** $2", 1 + i, user.handle),
                value: Misc.format(`Level **$1** ($2 / $3 XP, **$4** total)`, user.level, user.XP, user.passXP, user.totalXP),
                inline: false
            });
        }
        host.clientManager.respondEmbed(message.channel, Misc.embed(guild, host.client.user, null, null, fields));
    })
];

const settings = [

];

module.exports = LevelExtension;

const Host = require("../Host");
