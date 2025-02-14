// db.js
const { Pool } = require('pg');

const pool = new Pool({
  // 可從環境變數讀取DATABASE_URL, 也可以直接在這裡寫連線字串
  connectionString: process.env.DATABASE_URL || 'postgre://myuser:password@localhost:5432/wordscape'
});

module.exports = {
  query: (text, params) => pool.query(text, params),
}