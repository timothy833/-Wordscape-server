// db.js
const { Pool } = require('pg');

const pool = new Pool({
  // 可從環境變數讀取DATABASE_URL, 也可以直接在這裡寫連線字串
  connectionString: process.env.DATABASE_URL || 'postgre://myuser:password@localhost:5432/wordscape',
  ssl: {
    rejectUnauthorized: false // ✅ 這行強制開啟 SSL，避免 `error: SSL/TLS required`
  }
});

// ✅ 更完整的方式來檢查 SSL 設定
console.log("Database SSL Config:", pool.options?.ssl || "No SSL option found");

module.exports = {
  query: (text, params) => pool.query(text, params),
}