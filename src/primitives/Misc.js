const DiscordJS = require("discord.js");

module.exports = {
    version: "0.4.1",

    noop() { },
    /**
     * @param {DiscordJS.DiscordAPIError} e
     */
    throw(e) { throw e; },

    /**
     * @param {DiscordJS.User | DiscordJS.Guild} author
     * @param {DiscordJS.User} footer
     * @param {string} title
     * @param {string} description
     * @param {{ name: string; value: string; inline?: boolean; }[]} fields
     * @param {number} color
     */
    embed(author = null, footer = null, title = "", description = "", fields = [], color = 13525859) {
        const data = {
            title,
            description,
            color,
            fields,
            author: author ? {
                icon_url: author instanceof DiscordJS.User ? author.displayAvatarURL : author.iconURL,
                name: author instanceof DiscordJS.User ? `${author.username}#${author.discriminator}` : author.name
            } : null,
            footer: footer ? {
                icon_url: footer.displayAvatarURL,
                text: `${footer.username}#${footer.discriminator}`
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

    /**
     * @param {number} value
     */
    prettyMemory(value) {
        const units = ["B", "kiB", "MiB", "GiB", "TiB"]; let i = 0;
        for (; i < units.length && value / 1024 > 1; i++)
            value /= 1024;
        return `${value.toFixed(1)} ${units[i]}`;
    },
    /**
     * @param {NodeJS.MemoryUsage} value
     */
    prettyMemoryData(value) {
        return {
            heapUsed: this.prettyMemory(value.heapUsed),
            heapTotal: this.prettyMemory(value.heapTotal),
            rss: this.prettyMemory(value.rss),
            external: this.prettyMemory(value.external)
        }
    },
    /**
     * @param {number} seconds
     */
    prettyTime(seconds) {
        seconds = ~~seconds;

        let minutes = ~~(seconds / 60);
        if (minutes < 1) return `${seconds} seconds`;
        if (seconds === 60) return `1 minute`;

        let hours = ~~(minutes / 60);
        if (hours < 1) return `${minutes} minute${minutes === 1 ? "" : "s"} ${seconds % 60} second${seconds === 1 ? "" : "s"}`;
        if (minutes === 60) return `1 hour`;

        let days = ~~(hours / 24);
        if (days < 1) return `${hours} hour${hours === 1 ? "" : "s"} ${minutes % 60} minute${minutes === 1 ? "" : "s"}`;
        if (hours === 24) return `1 day`;
        return `${days} day${days === 1 ? "" : "s"} ${hours % 24} hour${hours === 1 ? "" : "s"}`;
    },
    /**
     * @param {number} seconds
     */
    shortPrettyTime(milliseconds) {
        let seconds = ~~(milliseconds / 1000);
        if (seconds < 1) return `${milliseconds}ms`;
        if (milliseconds === 1000) return `1s`;

        let minutes = ~~(seconds / 60);
        if (minutes < 1) return `${seconds}s`;
        if (seconds === 60) return `1m`;

        let hours = ~~(minutes / 60);
        if (hours < 1) return `${minutes}m`;
        if (minutes === 60) return `1h`;

        let days = ~~(hours / 24);
        if (days < 1) return `${hours}h`;
        if (hours === 24) return `1d`;
        return `${days}d`;
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

    VALUE_MUST_BE_NONEMPTY_STRING: "must be a non-empty string",
    VALUE_MUST_BE_STRING: "must be a string",
    VALUE_MUST_BE_INT: "must be an integer",
    VALUE_MUST_BE_FLOAT: "must be a number",
    VALUE_MUST_BE_BOOL: "must be `true` or `false`",

    VALUE_MUST_BE_ARRAY: "must be an array",
    VALUE_MUST_BE_STRINGS: "must be a string array",
    VALUE_MUST_BE_INTS: "must be an integer array",
    VALUE_MUST_BE_FLOATS: "must be a number array",

    VALUE_GUILD_NOEX: "guild `$1` does not exist",
    VALUE_CHANNEL_NOEX: "channel `$1` does not exist",
    VALUE_ROLE_NOEX: "role `$1` does not exist",
    VALUE_USER_NOEX: "user `$1` does not exist",

    HCOMMANDS_CANNOT_USE: "cannot use commands here",
    HCOMMANDS_UNKNOWN: "unknown command `$1`",

    HSETTINGS_NEED_NAME: "provide setting name",
    HSETTINGS_UNKNOWN: "unknown setting `$1`",
    HSETTINGS_INVALID: "invalid setting value `$1`",
    HSETTINGS_SUGGESTION_1: "perhaps you meant `$1`?",
    HSETTINGS_SUGGESTION_2: "perhaps you meant `$1`, `$2`?",
    HSETTINGS_SUGGESTION_3: "perhaps you meant `$1`, `$2`, `$3`?",
    HSETTINGS_SUGGESTION_MANY: "perhaps you meant `$1`, `$2`, `$3`, $4 other?",
};

const Host = require("../Host");
