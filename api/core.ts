import DBClient from "../db/core";
import { env } from "../env/vars";
import Discord from "discord.js";
import * as config from "../config.json";
import { CommandHandler, Config } from "./interface"

//	Extends class, better structure.
export default class DiscordBot extends Discord.Client {
    public databaseClient: DBClient
    public defaultSettings: Config
    public commands: Discord.Collection<string, CommandHandler>
    public emojiList: Discord.Collection<string, Discord.Emoji> | undefined

    constructor(option?: any) {
        super(option);
        this.defaultSettings = config;
        this.databaseClient = new DBClient();
        this.commands = new Discord.Collection();
        this.emojiList = new Discord.Collection();
    }
    init() {
        this.databaseClient.init();
    }
    loadCommands() {
        return require("../modules/commands")(this);
    }
    loadEvents() {
        return require("../modules/events")(this);
    }
    async login(token?: string | undefined) {
        this.token = token ? token : await env.getToken()
        var r = await super.login(this.token)
        console.log(`Logged in as ${this.user.tag}`)
        return r
    }
};