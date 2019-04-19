const fs = require("fs");

const Handler = require("../hooks/Handler");

/**
 * @template T
 */
class Entity {
    /**
     * @param {string} path
     * @param {T} defaultData
     */
    constructor(path, defaultData) {
        this.path = path;
        this.dirty = 0;
        this.running = false;

        if (fs.existsSync(this.path))
            this.data = this.decode(fs.readFileSync(this.path));
        else {
            this.data = defaultData;
            fs.writeFileSync(this.path, this.encode(defaultData));
        }
    }

    /**
     * @param {T} data
     * @returns {Buffer}
     */
    encode(data) {
        return Buffer.from(JSON.stringify(data), "utf-8");
    }
    /**
     * @param {Buffer} data
     * @returns {T}
     */
    decode(data) {
        return JSON.parse(data.toString("utf-8"));
    }

    flush() {
        const self = this;
        if (self.running) return self.dirty++, false;
        self.running = true;
        fs.writeFile(self.path, this.encode(self.data), () => {
            self.running = false;
            if (!self.dirty) return;
            self.dirty = 0;
            self.flush();
        });
        return true;
    }
}

class DataHandler extends Handler {
    /**
     * @param {Host} host
     */
    constructor(host) {
        super(host);

        /** @type {{ [path: string]: Entity<any> }} */
        this.entities = { };

        if (!fs.existsSync(this.settings.dataLocation))
            fs.mkdirSync(this.settings.dataLocation);
    }

    static get id() { return "hdata"; }

    /**
     * @template T
     * @param {string} path
     * @param {T} defaultData
     * @returns {T}
     */
    get(path, defaultData) {
        path = this.settings.dataLocation + path;
        if (!(path in this.entities))
            this.entities[path] = new Entity(path, defaultData);
        return this.entities[path].data;
    }
    /**
     * @template T
     * @param {string} path
     * @param {T} data
     */
    set(path, data) {
        path = this.settings.dataLocation + path;
        if (!(path in this.entities))
            this.entities[path] = new Entity(path);
        this.entities[path].data = data;
        return this.entities[path].flush();
    }
    /**
     * @param {string} path
     */
    flush(path) {
        path = this.settings.dataLocation + path;
        if (!(path in this.entities))
            throw new Error("cannot flush non-existing entity");
        return this.entities[path].flush();
    }
}

module.exports = DataHandler;

const Host = require("../Host");
