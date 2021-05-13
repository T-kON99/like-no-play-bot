import DiscordBot from "./core";
import Discord from "discord.js";
// Callback function for command
export interface CommandHandler {
    [key: string]: undefined | object | boolean | number | bigint | string | Function,
    name: string,
    aliases: string[],
    description: string,
    cooldown: number,
    updatable: boolean,
    permLevel: 'everyone',
    usage: string,
    execute(client: DiscordBot, message: Discord.Message, args: string[]): void
}
// config.json
export interface Config {
    prefix: string
}
