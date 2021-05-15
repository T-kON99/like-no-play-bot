import { Client, QueryResult } from "pg"
import { env } from "../env/vars";
import consts from "./consts";
import Discord from "discord.js";
import * as config from "../config.json";
import { timeStamp } from "console";
import fs from "fs";

interface DBResult<T> {
    Code: number,
    RowsUpdated: number,
    Message: string,
    Result: T
}

interface TipsBalanceRecord {
    tip_balance: number
}

interface TodayTipsAttemptRecord {
    tip_daily_balance: number
}



export default class DBClient extends Client {
    public client: Client
    public conf: any
    public isProduction: boolean
    public initScriptFile: string
    constructor(option?: any) {
        super(option);
        this.client = new Client(option);
        this.conf = option;
        this.isProduction = false;
        this.initScriptFile = './db/init.sql';
    }
    async init() {
        try {
            this.isProduction = await env.isProd()
            if (this.isProduction) {
                this.client = new Client({
                    connectionString: await env.getDatabaseUrl(),
                    ssl: {
                        rejectUnauthorized: !(await env.isProd()),
                    }
                })
            } else if (!this.conf) {
                this.client = new Client({
                    connectionString: await env.getDatabaseUrl(),
                })
            }
            await this.client.connect()
            console.log(`Connected to database host ${this.client.host}`);
            var initQuery = (await fs.promises.readFile(this.initScriptFile)).toString()
            var res = await this.client.query(initQuery);
            res.rowCount ? console.log(`Created table for database ${await env.getDatabaseUrl()}`) : {}
        } catch (err) {
            console.log(`Error initializing connection to database ${err}`);
            throw err;
        }
    }
    // TODO: Refactor the duplicate codes to these 2 GET/SET
    async getFromUser(user: Discord.User, table: string, columns: string[]) {

    }
    async setFromUser(user: Discord.User, table: string, columns: string[], values: any[]) {

    }
    async getTipsBalance(user: Discord.User): Promise<DBResult<TipsBalanceRecord>> {
        var tableName = "tipsbalancelist"
        try {
            var res = await this.client.query(`SELECT tip_balance FROM ${tableName} WHERE user_id='${user.id}'`)
            var response: DBResult<TipsBalanceRecord>
            if (res.rowCount) {
                response = {
                    Code: consts.Codes.SuccessRecord,
                    Message: "",
                    RowsUpdated: res.rowCount,
                    Result: res.rows[0]
                }
                console.log(`Get tips balance record ${tableName} of user ${user.tag} ${user.id}`)
                console.log(response)
                return response
            }
            response = {
                Code: consts.Codes.SuccessRecord,
                Message: consts.Errors.StatusErrorNoRecordError,
                RowsUpdated: 0,
                Result: { tip_balance: 0 }
            }
            console.log(`Get tips balance record ${tableName} of user ${user.tag} ${user.id}`)
            console.log(response)
            return response
        } catch (err) {
            console.error(err);
            return {
                Code: consts.Codes.ErrorRecord,
                Message: err,
                RowsUpdated: 0,
                Result: { tip_balance: 0 }
            }
        }
    }
    async setTipsBalance(user: Discord.User, value: number): Promise<DBResult<number>> {
        var tableName = "tipsbalancelist"
        if (value < 0) {
            return {
                Code: consts.Codes.ErrorRecord,
                Message: `value ${value} can't be negative`,
                RowsUpdated: 0,
                Result: 0
            }
        }
        try {
            var res: QueryResult<any>
            var dbRes = await this.getTipsBalance(user)
            var response: DBResult<number>
            if (dbRes.Code === consts.Codes.SuccessRecord && !dbRes.RowsUpdated) {
                res = await this.client.query(`INSERT INTO ${tableName} (user_id, tip_balance, updated_at) VALUES ('${user.id}', ${value}, to_timestamp(${Date.now()}/1000.0))`)
                response = {
                    Code: consts.Codes.SuccessRecord,
                    Message: "",
                    RowsUpdated: res.rowCount,
                    Result: value
                }
                console.log(`Inserted tips balance record ${tableName} for user ${user.id}, value ${value}`);
                console.log(response);
                return response
            }
            var res = await this.client.query(`UPDATE ${tableName} SET tip_balance=${value}, updated_at=to_timestamp(${Date.now()}/1000.0) WHERE user_id='${user.id}'`)
            if (!res.rowCount) {
                response = {
                    Code: consts.Codes.ErrorRecord,
                    Message: consts.Errors.StatusErrorUpdateError,
                    RowsUpdated: res.rowCount,
                    Result: 0
                }
                console.log(`Error updating tips balance record ${tableName} user ${user.id}, value ${value}`);
                console.log(response);
                return response
            }
            response = {
                Code: consts.Codes.SuccessRecord,
                Message: "",
                RowsUpdated: res.rowCount,
                Result: value
            }
            console.log(`Updated tips balance record ${tableName} for user ${user.tag} ${user.id}, value ${value}`);
            console.log(response);
            return response
        } catch (err) {
            console.error(err)
            return {
                Code: consts.Codes.ErrorRecord,
                Message: err,
                RowsUpdated: 0,
                Result: 0
            }
        }
    }
    async getTodayTipAttempt(user: Discord.User): Promise<DBResult<TodayTipsAttemptRecord>> {
        var tableName = "tipsdailylist"
        try {
            var res = await this.client.query(`SELECT tip_daily_balance, updated_at FROM ${tableName} WHERE user_id='${user.id}' and updated_at::DATE=NOW()::DATE`)
            var response: DBResult<TodayTipsAttemptRecord>
            if (res.rowCount) {
                response = {
                    Code: consts.Codes.SuccessRecord,
                    Message: "",
                    RowsUpdated: res.rowCount,
                    Result: res.rows[0]
                }
                console.log(`Get tips today attempt record ${tableName} of user ${user.tag} ${user.id}`)
                console.log(response)
                return response
            }
            response = {
                Code: consts.Codes.SuccessRecord,
                Message: consts.Errors.StatusErrorNoRecordError,
                RowsUpdated: 0,
                Result: { tip_daily_balance: 0 }
            }
            console.log(`Get tips today attempt record ${tableName} of user ${user.tag} ${user.id}`)
            console.log(response)
            return response
        } catch (err) {
            console.error(err);
            return {
                Code: consts.Codes.ErrorRecord,
                Message: err,
                RowsUpdated: 0,
                Result: { tip_daily_balance: 0 }
            }
        }
    }
    async setTodayTipAttempt(user: Discord.User, value: number): Promise<DBResult<number>> {
        var tableName = "tipsdailylist"
        if (value < 0) {
            return {
                Code: consts.Codes.ErrorRecord,
                Message: `value ${value} can't be negative`,
                RowsUpdated: 0,
                Result: 0
            }
        }
        try {
            var res: QueryResult<any>
            var dbRes = await this.getTodayTipAttempt(user)
            if (dbRes.Code === consts.Codes.SuccessRecord && !dbRes.RowsUpdated) {
                console.log(`Inserting tips today attempt record ${tableName} for user ${user.id}, value ${value}`);
                res = await this.client.query(`INSERT INTO ${tableName} (user_id, tip_daily_balance, updated_at) VALUES ('${user.id}', ${value}, to_timestamp(${Date.now()}/1000.0)) ON CONFLICT (user_id) DO UPDATE SET tip_daily_balance=${value}, updated_at=to_timestamp(${Date.now()}/1000.0)`)
                return {
                    Code: consts.Codes.SuccessRecord,
                    Message: "",
                    RowsUpdated: res.rowCount,
                    Result: value
                }
            }
            var res = await this.client.query(`UPDATE ${tableName} SET tip_daily_balance=${value}, updated_at=to_timestamp(${Date.now()}/1000.0) WHERE user_id='${user.id}'`)
            if (!res.rowCount) {
                return {
                    Code: consts.Codes.ErrorRecord,
                    Message: consts.Errors.StatusErrorUpdateError,
                    RowsUpdated: res.rowCount,
                    Result: 0
                }
            }
            return {
                Code: consts.Codes.SuccessRecord,
                Message: "",
                RowsUpdated: res.rowCount,
                Result: value
            }
        } catch (err) {
            console.error(`Error ${err}`)
            return {
                Code: consts.Codes.ErrorRecord,
                Message: err,
                RowsUpdated: 0,
                Result: 0
            }
        }
    }
}