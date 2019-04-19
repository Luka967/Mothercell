const Misc = require("../primitives/Misc");
const Handler = require("../hooks/Handler");
const SettingList = require("../settings/SettingList");
const Command = require("../commands/Command");

class SettingsHandler extends Handler {
    /**
     * @param {Host} host
     */
    constructor(host) {
        super(host);

        /** @type {SettingList} */
        this.settingList = new SettingList();
    }

    static get id() { return "hsettings"; }

    onStart() {
        this.host.commandHandler.commandList.add(...commands);
    }
    onStop() {
        this.host.commandHandler.commandList.remove(...commands);
    }
}

const commands = [
    new Command(SettingsHandler, "setting", "<name> [action value]", "read or change a setting", (host, args, message) => {
        if (args.length < 1) {
            host.clientManager.respond(message.channel, "fail", Misc.HSETTINGS_NEED_NAME);
            return;
        }
        const settingName = args[0];
        let result;

        if (args.length === 1)
            result = host.settingsHandler.settingList.get(settingName, host, message);
        else {
            let newSettingValue;
            try {
                newSettingValue = args.slice(1).join(" ");
                newSettingValue = JSON.parse(newSettingValue);
            } catch (e) {
                host.clientManager.respond(message.channel, "fail", Misc.HSETTINGS_INVALID, newSettingValue);
                return;
            }
            result = host.settingsHandler.settingList.set(settingName, host, message, newSettingValue);
        }
        if (!result.found) {
            host.clientManager.respond(message.channel, "fail", Misc.HSETTINGS_UNKNOWN, settingName);
            return;
        }
        if (result.type === "get")
            host.clientManager.respond(message.channel, "info", "`$1`", JSON.stringify(result.result, null, true));
        else if (result.type === "set" && result.result.success)
            host.clientManager.respond(message.channel, "info", "$1", result.result.message || "updated successfully");
        else
            host.clientManager.respond(message.channel, "fail", "$1", result.result.message || "updating failed");
    })
];

module.exports = SettingsHandler;

const Host = require("../Host");
const DiscordJS = require("discord.js");
