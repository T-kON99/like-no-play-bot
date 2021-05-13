import DiscordBot from "../api/core";
import path from "path"
import fs from "fs"

module.exports = (client: DiscordBot) => {
    const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.ts'));
    for (const file of eventFiles) {
        const event: Function = require(`../events/${path.parse(file).name}`);
        const eventName = file.split('.')[0];
        client.on(eventName, event.bind(null, client));
    }
    return eventFiles;
};