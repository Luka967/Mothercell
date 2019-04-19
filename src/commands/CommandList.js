class CommandList {
    constructor() {
        /** @type {{ [name: string]: Command }} */
        this.commands = { };
    }

    /**
     * @param {string} name
     * @param {Host} host
     * @param {DiscordJS.Message} message
     * @param {string[]} args
     */
    execute(name, host, message, args) {
        name = name.toLowerCase();
        if (name in this.commands)
            return this.commands[name].execute(host, message, args), true;
        return false;
    }

    /**
     * @param {Command[]} commands
     */
    add(...commands) {
        for (let command of commands) {
            if (command.name in this.commands)
                throw new Error(`command '${command.name}' was already added by hook ${command.hook.id}`);
            this.commands[command.name] = command;
        }
    }
    /**
     * @param {Command[]} commands
     */
    remove(...commands) {
        for (let command of commands) {
            if (!(command.name in this.commands))
                throw new Error(`command '${command.name}' wasn't added`);
            if (this.commands[command.name].hook !== command.hook)
                throw new Error(`command '${command.name}' was added by a different hook ${command.hook.id}`);
            delete this.commands[command.name];
        }
    }
}

module.exports = CommandList;

const Command = require("./Command");
const Host = require("../Host");
const DiscordJS = require("discord.js");
