import DiscordBot from "../api/core";

module.exports = (client: DiscordBot) => {
    console.log(`${client.user.tag} is ready`)
    const config = client.defaultSettings;
    try {
        client.emojiList = client.guilds.get('299841356942278656')?.emojis;
    }
    catch (err) {
        console.log(err);
    }
    client.user.setActivity(`type ${config.prefix}help and start tipping`);
};
