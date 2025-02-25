const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer =  require('nodemailer');
require('dotenv').config(); // 確保 .env 變數被讀取

// 取得所有使用者
exports.getUsers = async ( req, res, next )=> {
    try {
        const users = await userModel.getAllUsers();
        res.json(users);
    }catch(error){
        next(error);
    }
};

exports.getUser = async (req, res, next) => {
    try {
        // 確保 UUID 格式正確
        if (!req.params.id.match(/^[0-9a-fA-F-]{36}$/)) {
            return res.status(400).json({ message: "Invalid UUID format" });
        }

        const user = await userModel.getUserById(req.params.id);
        if(!user) return res.status(404).json({error: '找不到使用者'}); 
        res.json(user); 
    } catch (error) {
        next(error);
    }
};

//註冊API 
exports.register = async( req, res, next) => {
    try {
        // console.log("Request Body:", req.body);
        const { username, email, password } = req.body;

        // 確保必填欄位存在
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Missing required fields 缺少必要欄位" });
        }

        // 創建新使用者
        const newUser = await userModel.createUser(req.body);

        res.status(201).json(newUser);
    } catch (error) {
        console.error("Error in register controller:", error);
        next(error);
    }
};

//登入API
exports.login = async (req, res, next) => {
    try {
        const {email, password} = req.body;
        const user =  await userModel.getUserByEmail(email);
        if(!user) return res.status(401).json({error: 'Email 不存在'})
        //驗證密碼
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) return res.status(401).json({ error: '密碼錯誤' });
        //產生JWT token，設定有效期，例如1小時
        const token = jwt.sign({id: user.id, username: user.username}, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        next(error);
    }
}

// 更新使用者資訊（支援更改密碼）
exports.updateUser = async(req, res, next) => { 
    try {
        const updateFields = {};
        const { username, email, bio, profile_picture, password } = req.body; 

        if (username) updateFields.username = username;
        if (email) updateFields.email = email;
        if (bio) updateFields.bio = bio;
        if (profile_picture) updateFields.profile_picture = profile_picture;

        // 如果有新密碼先進行加密
        if(password) {
            updateFields.password = await bcrypt.hash(password, 10);
        }
        const updateUser = await userModel.updateUser(req.params.id, updateFields);

        res.json(updateUser);
    } catch (error) {
        console.error("Controller Error:", error.message);
        next(error);
    }
};

//忘記密碼（發送重設密碼Email）
exports.forgotPassword = async (req, res, next) => {
    try {
        const {email} = req.body;
        const user = await userModel.getUserByEmail(email);
        if(!user) return res.status(404).json({error: 'Email 不存在'});

        //產生Token
        const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, { expiresIn: '15m'});

        //發送 Email 
        const transporter = nodemailer.createTransport({
            service: process.env.SMTP_SERVICE, // 這裡會從 .env 讀取 Gmail / Yahoo
            host: process.env.SMTP_HOST,// ✅ Gmail SMTP 伺服器
            port: process.env.SMTP_PORT || 587,//✅ 587 是 TLS 連接埠，適合大多數 Email 服務
            secure: process.env.SMTP_SECURE === "true", // ✅ 這樣就可以靈活調整
            auth: {
                user: process.env.EMAIL_USER, // 這是你自己網站用來發信的 Email
                pass: process.env.EMAIL_PASS // 這是 SMTP 密碼（或應用程式專用密碼）
            }
        })

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: '🔐 密碼重設請求',
            html: `
                <p>親愛的 ${user.username}:</p>
                <p>我們收到您要求重設密碼的請求。如果這是您本人發出的請求，請點擊以下連結設定新密碼：</p>
                <p>
                    <a href="${process.env.FRONTEND_URL}/reset-password?token=${token}" 
                       style="background-color:#008CBA;color:white;padding:10px 20px;text-decoration:none;">
                       🔄 重設密碼
                    </a>
                </p>
                <p>如果您沒有請求重設密碼，請忽略此電子郵件。</p>
                <p>此連結將於 15 分鐘後過期。</p>
                <hr>
                <p>感謝您的使用，<br>您的網站團隊</p>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({message: '請檢查Email 以重設密碼'});

    } catch (error) {
        next(error);
    }
}

//重設密碼(使用Token）
exports.resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword} = req.body;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userModel.updateUserPassword(decoded.id, hashedPassword);
        
        res.json({message: '密碼以重設'});
    } catch (error) {
        next(error);
    }
}

// 刪除使用者
exports.deleteUser = async (req, res, next) =>{
    try {
        await userModel.deleteUser(req.params.id);
        res.json({message: "使用者已刪除"});
    } catch (error) {
        next(error);
    }
};