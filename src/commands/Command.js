class Command {
    /**
     * @param {typeof Hook} hook
     * @param {string} name
     * @param {string} args
     * @param {string} desc
     * @param {(host: Host, args: string[], message: DiscordJS.Message, user: DiscordJS.User, channel: DiscordJS.TextChannel | DiscordJS.DMChannel | DiscordJS.GroupDMChannel, guild: DiscordJS.Guild) => void} executor
     */
    constructor(hook, name, args, desc, executor) {
        this.hook = hook;
        this.name = name;
        this.args = args;
        this.desc = desc;
        this.executor = executor;
    }

    /**
     * @param {Host} host
     * @param {DiscordJS.Message} message
     * @param {string[]} args
     */
    execute(host, message, args) {
        this.executor(host, args, message, message.author, message.channel, message.guild);
    }
}

module.exports = Command;

const Hook = require("../hooks/Hook");
const Host = require("../Host");
const DiscordJS = require("discord.js");
