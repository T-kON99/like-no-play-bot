const conf = import("../secret.json").then((secret) => {
    return {
        TOKEN: secret.token,
        DATABASE_URL: secret.dbUrl,
        DATABASE_NAME: secret.dbName,
        DATABASE_PASSWORD: secret.dbPwd,
        IS_PRODUCTION: false
    }
}).catch((err) => {
    if (err.code !== "MODULE_NOT_FOUND") {
        throw err;
    }
    return {
        TOKEN: process.env.TOKEN || "",
        DATABASE_URL: process.env.DATABASE_URL || "",
        DATABASE_NAME: process.env.DATABASE_NAME,
        DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
        IS_PRODUCTION: true
    }
});

export const env = {
    async getToken() {
        return (await conf).TOKEN
    },
    async getDatabaseUrl() {
        return (await conf).DATABASE_URL
    },
    async getDatabaseName() {
        return (await conf).DATABASE_NAME
    },
    async getDatabasePassword() {
        return (await conf).DATABASE_PASSWORD
    },
    async isProd() {
        return (await conf).IS_PRODUCTION
    }
}