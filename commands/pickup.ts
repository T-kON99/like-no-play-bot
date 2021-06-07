import DiscordBot from "../api/core";
import Discord from "discord.js";
import * as config from "../config.json";
import fs from "fs";

module.exports = {
    name: 'pickup',
    aliases: ['pick', 'joke', 'up', 'p'],
    description: 'Give you a pickup line',
    usage: `${config.prefix}pickup`,
    example: `${config.prefix}pickup`,
    cooldown: 3,
    updateable: true,
    permLevel: 'everyone',
    execute(client: DiscordBot, message: Discord.Message, args: string[]) {
        const pickupFileName = "pickup.txt"
        fs.readFile(`./${config.assetDir}/${pickupFileName}`, function (error, buffer) {
            if (error) console.log(error);
            else {
                const list = buffer.toString().split('\n').map(x => x.trim());
                const line = list[Math.floor(Math.random() * list.length)]
                message.channel.send(line.charAt(0).toUpperCase() + line.slice(1).toLowerCase());
            }
        });
    },
}