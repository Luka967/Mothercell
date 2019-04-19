const fs = require("fs");
const Host = require("../src/Host");
const readline = require("readline");

const DefaultSettings = require("../src/Settings");
const DefaultExtensions = [
    //require("../src/extensions/AutomodExtension"),
    require("../src/extensions/BasicExtension"),
    //require("../src/extensions/LevelExtension"),
    //require("../src/extensions/ModExtension"),
    require("../src/extensions/OwnerExtension"),
];

/** @returns {DefaultSettings} */
function readSettings() {
    try { return JSON.parse(fs.readFileSync("./settings.json", "utf-8")); }
    catch (e) {
        console.log("caught error while parsing/reading settings.json:", e.stack);
        process.exit(1);
    }
}
/** @param {DefaultSettings} settings */
function overwriteSettings(settings) {
    fs.writeFileSync("./settings.json", JSON.stringify(settings, null, 4), "utf-8");
}

if (!fs.existsSync("./settings.json")) {
    overwriteSettings(DefaultSettings);
    process.exit(0);
}
const settings = readSettings();
const currentHost = new Host(settings);
const logger = currentHost.logger;

overwriteSettings(currentHost.settings);
require("./log-handler")(currentHost);

let commandStreamClosing = false;
const commandStream = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: "",
    historySize: 64,
    removeHistoryDuplicates: true
});
commandStream.once("SIGINT", () => {
    logger.inform("command stream caught SIGINT");
    commandStreamClosing = true;
    commandStream.close();
    currentHost.stop();
    process.exitCode = 0;
});
function ask() {
    if (commandStreamClosing) return;
    commandStream.question("@ ", (input) => {
        setTimeout(ask, 0);
        if (!(input = input.trim())) return;
        logger.printFile(`@ ${input}`);
        // TODO: CLI commands
        if (!currentHost.commands.execute(null, input))
            logger.print(`unknown command ${input}`);
    });
}
/*
setTimeout(() => {
    logger.debug("command stream open");
    ask();
}, 1000);
*/

for (let extension of DefaultExtensions)
    currentHost.addExtension(extension);
currentHost.start();
