class SettingList {
    constructor() {
        /** @type {{ [name: string]: Setting }} */
        this.settings = { };
    }

    /**
     * @template T
     * @param {string} name
     * @param {Host} host
     * @param {DiscordJS.Message} source
     * @returns {{ type: "get", found: boolean, result?: T }}
     */
    get(name, host, source) {
        name = name.toLowerCase();
        if (name in this.settings)
            return { type: "get", found: true, result: this.settings[name].getValue(host, source) };
        return { type: "get", found: false };
    }
    /**
     * @template T
     * @param {string} name
     * @param {Host} host
     * @param {DiscordJS.Message} source
     * @param {T} value
     * @returns {{ type: "set", found: boolean, result?: { success: boolean, message?: string } }}
     */
    set(name, host, source, value) {
        name = name.toLowerCase();
        if (name in this.settings)
            return { type: "set", found: true, result: this.settings[name].setValue(host, source, value) };
        return { type: "set", found: false };
    }

    /**
     * @param {Setting[]} settings
     */
    add(...settings) {
        for (let setting of settings) {
            if (setting.name in this.settings)
                throw new Error(`setting '${setting.name}' was already added by hook ${setting.hook.id}`);
            this.settings[setting.name] = setting;
        }
    }
    /**
     * @param {Setting[]} settings
     */
    remove(...settings) {
        for (let setting of settings) {
            if (!(setting.name in this.settings))
                throw new Error(`setting '${setting.name}' wasn't added`);
            if (this.settings[setting.name].hook !== setting.hook)
                throw new Error(`setting '${setting.name}' was added by a different hook ${setting.hook.id}`);
            delete this.settings[setting.name];
        }
    }
}

module.exports = SettingList;

const Setting = require("./Setting");
const Host = require("../Host");
const DiscordJS = require("discord.js");
