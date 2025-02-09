require('dotenv').config();

module.exports = {
    development: {
        client: 'pg', // 使用 PostgreSQL
        connection: process.env.DATABASE_URL, // 從環境變數讀取連線字串
        migrations: {
            directory: './migrations'  // 指定 migration 檔案存放的資料夾
        },
        seeds: {
            directory: './seeds' // 指定種子檔案存放的資料夾（可選）
        }
    },
    production: {
        client: 'pg',
        connection: process.env.DATABASE_URL,
        migrations: {
            directory: './migrations'
        },
        seeds: {
            directory: './migration'
        }
    }

}