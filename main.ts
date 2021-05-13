//	Load api
import DiscordBot from "./api/core"
const client = new DiscordBot();

//	load important data.
client.init();
client.loadEvents();
client.loadCommands();

client.login();