import DiscordBot from "../api/core";
import Discord from "discord.js";
import * as config from "../config.json";
import consts from "../db/consts";

module.exports = {
    name: 'tip',
    aliases: ['t', 'tip'],
    description: 'Tip a player to show your toxicity #LikeNoPlay',
    usage: `${config.prefix}tip`,
    example: `${config.prefix}tip <@!288658178147745792>`,
    cooldown: 3,
    updateable: true,
    permLevel: 'everyone',
    async execute(client: DiscordBot, message: Discord.Message, args: string[]) {
        if (!args.length) {
            var res = await client.databaseClient.getTipsBalance(message.author)
            var balance = res.Result.tip_balance
            if (res.Code !== consts.Codes.SuccessRecord) {
                message.channel.send(`Internal server error when querying tip balance info user ${message.author.tag} ${message.author.id}`)
                return
            }
            if (res.Code === consts.Codes.SuccessRecord && !res.RowsUpdated) {
                var updateRes = await client.databaseClient.setTipsBalance(message.author, config.defaultTipBalance)
                balance = updateRes.Result
            }
            message.channel.send(`${message.author} You have ${balance} credits!`)
            return
        }
        var userMention = args[0]
        const userRegex = new RegExp(`<@!([0-9]+)>`);
        if (!userMention.match(userRegex)) {
            console.log(`Invalid user ${userMention}`);
            message.channel.send(`${message.author} Can't tip non-existent toxic player, please make sure the user mentioned is a real toxic player`);
            return
        }

        var senderId = message.author.id;
        var receiverId = userMention.match(userRegex)![1];
        var isUsingDaily = true
        var canTip = true
        var freeAttemptToday = config.dailyTipAttempt
        var tipCost = args.length > 1 && !isNaN(parseInt(args[1])) ? parseInt(args[1]) : config.defaultTip
        if (senderId === receiverId) {
            message.channel.send(`${message.author} Please don't tip yourself, just stop.`)
            return
        }
        try {
            var receiver = await client.fetchUser(receiverId)
            var sender = await client.fetchUser(senderId)
            var senderAttemptRes = await client.databaseClient.getTodayTipAttempt(sender)
            // First check if sender has today's attempt or enough balance and has the data set in database
            if (senderAttemptRes.Code !== consts.Codes.SuccessRecord) {
                message.channel.send(`Internal server error when querying tip attempt info user ${sender.tag} ${sender.id}`)
                return
            }
            // If sender is a new/old user
            if (!senderAttemptRes.RowsUpdated) {
                freeAttemptToday--
                await client.databaseClient.setTodayTipAttempt(sender, config.dailyTipAttempt)
            } else {
                isUsingDaily = senderAttemptRes.Result.tip_daily_balance > 0
                freeAttemptToday = Math.max(senderAttemptRes.Result.tip_daily_balance - 1, 0)
                await client.databaseClient.setTodayTipAttempt(sender, freeAttemptToday)
            }
            // Handle sender tip balance
            if (!isUsingDaily) {
                var senderTipsRes = await client.databaseClient.getTipsBalance(sender)
                if (senderTipsRes.Code !== consts.Codes.SuccessRecord) {
                    message.channel.send(`Internal server error when querying tip balance info user ${sender.tag} ${sender.id}`)
                    return
                }
                if (senderTipsRes.Code === consts.Codes.SuccessRecord && !senderTipsRes.RowsUpdated) {
                    await client.databaseClient.setTipsBalance(sender, config.defaultTipBalance - tipCost)
                } else {
                    var newBalance = senderTipsRes.Result.tip_balance - tipCost
                    canTip = newBalance > 0
                    await client.databaseClient.setTipsBalance(sender, newBalance)
                }
            } else {
                // Daily attempt
                tipCost = config.defaultTip
            }

            // Handle receiver tip balance
            if (canTip) {
                var receiverTipsRes = await client.databaseClient.getTipsBalance(receiver)
                if (receiverTipsRes.Code !== consts.Codes.SuccessRecord) {
                    message.channel.send(`Internal server error when querying tip balance info user ${receiver.tag} ${receiver.id}`)
                    return
                }
                if (receiverTipsRes.Code === consts.Codes.SuccessRecord && !receiverTipsRes.RowsUpdated) {
                    await client.databaseClient.setTipsBalance(receiver, config.defaultTipBalance + tipCost)
                } else {
                    var newBalance = receiverTipsRes.Result.tip_balance + tipCost
                    await client.databaseClient.setTipsBalance(receiver, newBalance)
                }
                message.channel.send(`${message.author} tipped ${tipCost} to ${receiver}! You have ${freeAttemptToday}/${config.dailyTipAttempt} free ${config.defaultTip} tips available`)
                return
            } else {
                message.channel.send(`${message.author} You don't have enough tip credits!`)
                return
            }
        } catch (err) {
            message.channel.send(`Something went wrong, please try again...`)
            console.log(`Error ${err}`)
        }
    },
}