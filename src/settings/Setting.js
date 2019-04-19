/**
 * @template T
 */
class Setting {
    /**
     * @param {typeof Hook} hook
     * @param {string} name
     * @param {boolean} array
     * @param {(host: Host, source: DiscordJS.Message) => T} getter
     * @param {(host: Host, source: DiscordJS.Message, value: T) => { success: boolean, message?: string }} setter
     */
    constructor(hook, name, array, getter, setter) {
        this.hook = hook;
        this.name = name;
        this.array = array;
        this.getter = getter;
        this.setter = setter;
    }

    /**
     * @param {Host} host
     * @param {DiscordJS.Message} source
     */
    getValue(host, source) {
        return this.getter(host, source);
    }
    /**
     * @param {Host} host
     * @param {DiscordJS.Message} source
     * @param {T} value
     */
    setValue(host, source, value) {
        return this.setter(host, source, value);
    }
}

module.exports = Setting;

const Hook = require("../hooks/Hook");
const Host = require("../Host");
const DiscordJS = require("discord.js");
