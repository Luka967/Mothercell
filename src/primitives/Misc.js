const DiscordJS = require("discord.js");

module.exports = {
    version: "0.2.4",

    noop() { },
    /**
     * @param {DiscordJS.DiscordAPIError} e
     */
    throw(e) { throw e; },

    /**
     * @param {DiscordJS.User} userAuthor
     * @param {DiscordJS.User} userFooter
     * @param {string} title
     * @param {string} description
     * @param {{ name: string; value: string; inline?: boolean; }[]} fields
     * @param {number} color
     */
    embed(userAuthor = null, userFooter = null, title = "", description = "", fields = [], color = 13525859) {
        const data = {
            title,
            description,
            color,
            fields,
            author: userAuthor ? {
                icon_url: userAuthor.displayAvatarURL,
                name: userAuthor.username
            } : null,
            footer: userFooter ? {
                icon_url: userFooter.displayAvatarURL,
                text: `${userFooter.username}#${userFooter.discriminator}`
            } : null,
            timestamp: new Date().toISOString()
        };
        return new DiscordJS.RichEmbed(data);
    },

    /**
     * @param {string} str
     * @param {any[]} data
     */
    format(str, ...data) {
        for (let i = 0; i < data.length; i++) {
            const dataMaxLength = (2000 - str.length) / data.length >> 0;
            let v = String(data[i]);
            if (v.length > dataMaxLength)
                v = v.slice(0, dataMaxLength - 3) + "...";
            str = str.replace(`$${1 + i}`, v);
        }
        return str;
    },

    emotes: {
        ok: ":white_check_mark:",
        fail: ":negative_squared_cross_mark:",
        info: ":information_source:",
        greet: ":wave:",
    },

    ACTION_SEND_DM: 1,
    ACTION_SEND_MESSAGE_GUILD: 2,
    ACTION_SEND_EMBED_GUILD: 3,
    ACTION_DELETE_MESSAGE_GUILD: 4,

    NO_PERMISSION: "insufficient permissions",

    HCOMMANDS_CANNOT_USE: "cannot use commands here",
    HCOMMANDS_UNKNOWN: "unknown command `$1`",

    HSETTINGS_NEED_NAME: "provide setting name",
    HSETTINGS_UNKNOWN: "unknown setting `$1`",
    HSETTINGS_INVALID: "invalid setting value `$1`",

    SETTING_COMMANDS_PREFIX_STRING: "must be a string",
    SETTING_COMMANDS_PREFIX_STRLEN: "string must not be empty",

    SETTING_COMMANDS_CHANNELS_ARRAY: "must be an array",
    SETTING_COMMANDS_CHANNELS_STRING: "array elements must be strings",
    SETTING_COMMANDS_CHANNELS_NOEX: "channel `$1` does not exist",

    SETTING_COMMANDS_BROLES_ARRAY: "must be an array",
    SETTING_COMMANDS_BROLES_STRING: "array elements must be strings",
    SETTING_COMMANDS_BROLES_NOEX: "role `$1` does not exist",

    SETTING_COMMANDS_WROLES_ARRAY: "must be an array",
    SETTING_COMMANDS_WROLES_STRING: "array elements must be strings",
    SETTING_COMMANDS_WROLES_NOEX: "role `$1` does not exist",
};

const Host = require("../Host");
