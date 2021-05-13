import DiscordBot from "../api/core";
import { CommandHandler } from "../api/interface";
import fs from "fs";
import path from "path"


module.exports = (client: DiscordBot) => {
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.ts'));
    for (const file of commandFiles) {
        const commandHandler: CommandHandler = require(`../commands/${path.parse(file).name}`);
        client.commands.set(commandHandler.name, commandHandler);
        console.log(`Loaded command [${commandHandler.name}]`)
        if (commandHandler.aliases) {
            for (const names of commandHandler.aliases) client.commands.set(names, commandHandler);
        }
    }
    return client.commands;
};