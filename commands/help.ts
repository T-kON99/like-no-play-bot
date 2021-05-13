import DiscordBot from "../api/core";
import Discord from "discord.js";
import * as config from "../config.json";

module.exports = {
    name: 'help',
    aliases: ['help'],
    description: 'List all commands available',
    cooldown: 3,
    updatable: false,
    permLevel: 'everyone',
    usage: `\`${config.prefix}help\` / \`${config.prefix}help [command]\``,
    execute(client: DiscordBot, message: Discord.Message, args: string[]) {
        const { commands } = client;
        const data: string[] = [];
        const list: string[] = [];
        const helpEmbed = new Discord.RichEmbed()
            .setAuthor(`${message.client.user.username} Bot`, message.client.user.avatarURL)
            .setColor('#f442bc');
        if (!args.length) {
            const space = ' ';
            message.author.send('Here are the notes');
            data.push(`\`\`\`asciidoc\n${commands.map(command => {
                if (!list.includes(command.name)) {
                    list.push(command.name);
                    return config.prefix + command.name + space.repeat(11 - command.name.length) + `:: ${command.description}`;
                }
                // eslint-disable-next-line curly
            }).filter(command => command != null).join('\n')}\n\`\`\``);
            data.push(`Send \`${config.prefix}help [command name]\` to know more about the command!`);
            helpEmbed.addField('Commands', data);
        }
        else {
            if (!commands.has(args[0])) {
                return message.channel.send(`${message.author}, invalid command!`);
            }
            else {
                const command = commands.get(args[0])!;
                const space = ' ';
                if (!message.author.bot && message.channel.type != 'dm') message.author.send(`Details of \`${config.prefix}${command.name}\``);
                data.push('```asciidoc\n');
                for (const prop in command) {
                    // eslint-disable-next-line curly
                    if (prop == 'name' || (typeof command[prop] !== 'string' && typeof command[prop] != 'object')) continue;
                    else {
                        if (command[prop]) data.push(prop.charAt(0).toUpperCase() + prop.slice(1).toLowerCase() + space.repeat(15 - prop.length) + ':: ' + command[prop] + '\n');
                    }
                }
                data.push('\n```');
                helpEmbed.addField(`\`${config.prefix}${command.name}\``, data);
            }
        }
        client.generateInvite()
            .then(link => {
                helpEmbed.addField('**Want to Tip Toxic Players?**', `[Add this bot](${link})`);
                if (message.channel.type != 'dm' && !message.author.bot) message.channel.send(`${message.author}, check DM!`);
                if (!message.author.bot) message.author.send(helpEmbed);
            })
            .catch(err => {
                console.log(err);
            });
    },
};