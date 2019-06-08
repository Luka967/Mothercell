const util = require("util");
const DiscordJS = require("discord.js");
const Extension = require("../hooks/Extension");
const Misc = require("../primitives/Misc");
const Command = require("../commands/Command");

class OwnerExtension extends Extension {
    /**
     * @param {Host} host
     */
    constructor(host) {
        super(host);
    }

    static get id() { return "owner"; }

    onStart() {
        this.host.commandHandler.commandList.add(...commands);
    }
    onStop() {
        this.host.commandHandler.commandList.remove(...commands);
    }
}

const commands = [
    new Command(OwnerExtension, "eval", "<javascript>", "evaluate a script within Host", (host, args, message) => {
        if (message.author.id !== host.settings.hostOwner) {
            host.clientManager.respond(message.channel, "fail", Misc.NO_PERMISSION);
            return;
        }
        let time = host.preciseTime;

        let threw = false, resultType;
        const result = (function() {
            try { const v = eval(args.join(" ")); resultType = typeof v; return v; }
            catch (e) { threw = true; resultType = typeof e; return e instanceof Error ? e.stack : e; }
        }).bind(host)();

        time = host.preciseTime - time;

        const resultInspected = threw ? result : util.inspect(result, true, 0, false);
        host.clientManager.respond(
            message.channel,
            threw ? "fail" : "ok",
            "type: `$1`\n\n```js\n$2\n```\n:stopwatch: `$3` ms",
            resultType, resultInspected, time
        );
    }),
    new Command(OwnerExtension, "say", "<message>", "make the bot say something", (host, args, message) => {
        if (message.author.id !== host.settings.hostOwner) {
            host.clientManager.respond(message.channel, "fail", Misc.NO_PERMISSION);
            return;
        }
        message.delete().then(
            v => message.channel.send(args.join(" ")),
            Misc.noop
        ).catch(Misc.noop);
    }),
    new Command(OwnerExtension, "restart", "", "restart the bot shallowly", (host, args, message) => {
        if (message.author.id !== host.settings.hostOwner) {
            host.clientManager.respond(message.channel, "fail", Misc.NO_PERMISSION);
            return;
        }
        host.clientManager.respond(message.channel, "ok", "restarting...").then(myMessage => {
            host.stop();
            host.start();
        });
    }),
    new Command(OwnerExtension, "stop", "", "stop the bot", (host, args, message) => {
        host.clientManager.respond(message.channel, "ok", "I hope it's for a good reason").then(() => {
            if (message.author.id !== host.settings.hostOwner) {
                host.clientManager.respond(message.channel, "fail", Misc.NO_PERMISSION);
                return;
            }
            host.stop();
            setTimeout(() => process.exit(0), 1000);
        });
    }),
    new Command(OwnerExtension, "crash", "", "intentionally crash the bot", (host, args, message) => {
        if (message.author.id !== host.settings.hostOwner) {
            host.clientManager.respond(message.channel, "fail", Misc.NO_PERMISSION);
            return;
        }
        throw new Error("Manually crashed");
    })
];

module.exports = OwnerExtension;

const Host = require("../Host");
