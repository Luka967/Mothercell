const DiscordJS = require("discord.js");

const ClientManager = require("./handlers/ClientManager");
const SettingsHandler = require("./handlers/SettingsHandler");
const CommandHandler = require("./handlers/CommandHandler");
const MessageHandler = require("./handlers/MessageHandler");
const DataHandler = require("./handlers/DataHandler");

const Settings = require("./Settings");
const Logger = require("./primitives/Logger");
const Ticker = require("./primitives/Ticker");

class Host {
    /**
     * @param {Settings} settings
     * @param {ExtensionData} data
     */
    constructor(settings) {
        this.running = false;
        this.ready = false;
        this.logger = new Logger();
        this.ticker = new Ticker();
        this.ticker.add(this.tick.bind(this));

        this.setSettings(settings);

        /** @type {DiscordJS.Client} */
        this.client = null;
        this.clientManager = new ClientManager(this);

        /** @type {{ [time: number]: Function[] }} */
        this.tasks = { };

        this.dataHandler = new DataHandler(this);
        this.settingsHandler = new SettingsHandler(this);
        this.messageHandler = new MessageHandler(this);
        this.commandHandler = new CommandHandler(this);

        /** @type {{ [id: string]: Extension }} */
        this.extensions = { };
    }

    /**
     * @param {Settings} settings
     */
    setSettings(settings) {
        this.settings = Object.assign({ }, Settings, settings);
        this.ticker.step = this.settings.hostTickerStep;
        this.logger.inform("settings updated");
    }

    start() {
        if (this.running)
            throw new Error("already running");
        this.running = true;
        this.logger.inform("starting");

        this.client = new DiscordJS.Client();
        this.clientManager.onStart();

        for (let id in this.extensions)
            this.extensions[id].onStart();
        this.settingsHandler.onStart();
        this.dataHandler.onStart();
        this.messageHandler.onStart();
        this.commandHandler.onStart();
    }
    stop() {
        if (!this.running)
            throw new Error("not running");
        this.running = false;
        this.logger.inform("stopping");

        this.clientManager.onStop();

        for (let id in this.extensions)
            this.extensions[id].onStop();
        this.commandHandler.onStop();
        this.messageHandler.onStop();
        this.dataHandler.onStop();
        this.settingsHandler.onStop();
    }

    /**
     * @param {number} timestamp
     * @param {Function} callback
     */
    addTask(timestamp, callback) {
        this.logger.debug(`task for ${timestamp} created`);
        (this.tasks[timestamp] = this.tasks[timestamp] || []).push(callback);
    }
    /**
     * @param {number} offset
     * @param {Function} callback
     */
    queueTask(offset, callback) {
        return this.addTask(Date.now() + offset, callback);
    }
    /**
     * @param {number} timestamp
     * @param {Function} callback
     */
    removeTask(timestamp, callback) {
        this.logger.debug(`task for ${timestamp} removed`);
        this.tasks[timestamp].splice(this.tasks[timestamp].indexOf(callback), 1);
    }

    /**
     * @param {typeof Extension} extension
     */
    addExtension(extension) {
        if (extension.id in this.extensions)
            throw new Error(`an extension with id '${extension.id}' has already been hooked`);
        this.logger.inform(`extension ${extension.id} hooked`);
        this.extensions[extension.id] = new extension(this);
    }
    /**
     * @param {typeof Extension} extension
     */
    removeExtension(extension) {
        if (!(extension.id in this.extensions))
            throw new Error(`an extension with id '${extension.id}' has not been hooked`);
        this.logger.inform(`extension ${extension.id} unhooked`);
        if (this.running) this.extensions[extension.id].onStop();
        delete this.extensions[extension.id];
    }

    tick() {
        const time = Date.now();
        for (let i in this.tasks) {
            if (parseInt(i) > time) break;
            for (let callback of this.tasks[i])
                callback();
            delete this.tasks[i];
        }
    }
}

module.exports = Host;

const Extension = require("./hooks/Extension");
