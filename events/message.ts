import DiscordBot from "../api/core";
import Discord from "discord.js";

const cooldowns = new Discord.Collection<string, Discord.Collection<string, number>>();
module.exports = (client: DiscordBot, message: Discord.Message) => {
    if (message.channel.type == 'dm' && !message.content.toLowerCase().includes('help')) return;
    else {
        const config = client.defaultSettings;
        const prefixMention = new RegExp(`^<@${client.user.id}>`);
        const prefix = message.content.match(prefixMention) ? message.content.match(prefixMention)![0] : config.prefix;
        //	Check if message doesn't with prefix, or was sent by bot, or doesn't have permission to send message.
        if (!message.content.startsWith(prefix)) return;
        else {
            if (message.channel instanceof Discord.TextChannel && !message.channel.permissionsFor(message.client.user)?.has('SEND_MESSAGES')) return;

            const args = message.content.slice(prefix.length).trim().split(/ +/g);
            const commandName = args.shift()?.toLowerCase() ?? "";

            if (!client.commands.has(commandName)) return;
            else {
                const command = client.commands.get(commandName)!;

                //	Employ cooldown avoid spam.
                if (!cooldowns.has(command.name)) {
                    cooldowns.set(command.name, new Discord.Collection<string, number>());
                }
                const now = Date.now();
                const timeStamps = cooldowns.get(command.name)!;
                const cooldownAmount = (command.cooldown || 3) * 1000;
                //	3 seconds if not specified.
                if (!timeStamps.has(message.author.id)) {
                    timeStamps.set(message.author.id, now);
                    setTimeout(() => timeStamps.delete(message.author.id), cooldownAmount);
                }
                else {
                    const expirationTime = timeStamps.get(message.author.id)! + cooldownAmount;
                    if (now < expirationTime) {
                        const timeLeft = (expirationTime - now) / 1000;
                        message.channel.send(`${message.author}, you just sent that message not long ago!`);
                        return message.channel.send(`Wait ${timeLeft.toFixed(1)} more second(s)!`);
                    }
                    timeStamps.set(message.author.id, now);
                    setTimeout(() => timeStamps.delete(message.author.id), cooldownAmount);
                }

                //	Do commands.
                try {
                    command.execute(client, message, args);
                    console.log(`${message.author.tag} ${message.author.id} ran [${command.name}] in ${message.guild.name} ${message.guild.id} ${message.guild.channels.get(message.channel.id)?.name} ${message.channel.id}`);
                }
                catch (err) {
                    console.log(err);
                    message.reply('There was an error handling the command.');
                }
            }
        }
    }
};