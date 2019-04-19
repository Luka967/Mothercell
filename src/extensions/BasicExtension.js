const util      = require("util");
const DiscordJS = require("discord.js");
const Extension = require("../hooks/Extension");
const Misc      = require("../primitives/Misc");
const Command   = require("../commands/Command");

class BasicExtension extends Extension {
    /**
     * @param {Host} host
     */
    constructor(host) {
        super(host);
        this.onMessageBind = this.onMessage.bind(this);
    }

    static get id() { return "basic"; }

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
    new Command(BasicExtension, "help", "", "display available commands", (host, args, message) => {
        const commands = host.commandHandler.commandList.commands;
        const fields = Object.keys(commands).map(v => {
                const cmd = commands[v];
                return {
                    name: Misc.format("**$1** $2", cmd.name, cmd.args),
                    value: Misc.format("$1", cmd.desc),
                    inline: false
                };
            });
        const embed = Misc.embed(host.client.user, message.author, null, null, fields);
        host.clientManager.respondEmbed(message.channel, embed);
    }),
];

module.exports = BasicExtension;

const Host = require("../Host");
