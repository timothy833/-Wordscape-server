// 1. 載入環境變數（從專案根目錄的 .env 檔案讀取）
require('dotenv').config();
console.log('Environment Variables:', process.env);

// 2. 載入 Express 與其他必要模組
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./initDb'); // 正確匯入資料庫初始化函數

//3.建立Express應用
const app = express();




//4. 設置內建中間件:使用Express 內建中間件
// 解析 JSON 格式的請求主體
app.use(express.json());
// 解析 URL-encoded 格式的資料（表單提交）
app.use(express.urlencoded({extended: true}));

//5. 設定CORS 中間件，允許來自指令來源的請求 CLIENT_ORIGIN=https://your-frontend-url.com

app.use(cors({
    origin: process.env.CLIENT_ORIGIN, // 根據前端網址進行調整
    credentials: true // 如果需要傳遞 Cookie 或身份驗證資訊
}))

// 6. 日誌中間件：每次請求時輸出請求方法與路由
//日誌中間件：紀錄每次請求的HTTP 方法與路由
app.use((req, res, next)=> {
    console.log(`${req.method} ${req.url}`);
    next();
});


// 7. 載入各個路由模組
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
// const commentRoutes = require('./routes/commentRoutes');
// const paymentRoutes = require('./routes/paymentRoutes');
// const subscriptionRoutes = require('./routes/subscriptionRoutes');
// const categoryRoutes = require('./routes/categoryRoutes');
// const tagRoutes = require('./routes/tagRoutes');
// const postTagRoutes = require('./routes/postTagRoutes');


// 8. 設定 API 路由（路徑可依需求自行調整）
// 如：當請求以 /api/users 開頭時，交由 userRoutes 處理
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
// app.use('/api/comments', commentRoutes);
// app.use('/api/payments', paymentRoutes);
// app.use('/api/subscriptions', subscriptionRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/tags', tagRoutes);
// app.use('/api/post-tags', postTagRoutes);

// 9. 測試路由：確認伺服器是否運作正常
app.get('/', (req, res) => {
    res.send('Express.js Server is running.');
});


// 9. 載入資料庫初始化模組（用於建立資料表）
// const initDb = require('./initDb');

// 10. 啟動伺服器，並在啟動後初始化資料庫 
//取得環境變數中的 PORT 設定，若未定義則預設為 5000
const PORT = process.env.PORT || 5001;

async function startServer() {
    try {
        // 初始化資料庫
        await initializeDatabase();
        console.log('Database initialization complete.');

        // 啟動 Express 伺服器
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error during database initialization:', error);
        process.exit(1); // 發生錯誤時終止應用程式
    }
}

// 11. 執行伺服器啟動
startServer();