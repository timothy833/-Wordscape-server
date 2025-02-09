const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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
        console.log("Request Body:", req.body);
        const { username, email, password } = req.body;

        // 確保必填欄位存在
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Missing required fields" });
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

exports.updateUser = async(req, res, next) => { 
    try {
        const updateUser = await userModel.updateUser(req.params.id, req.body);
        res.json(updateUser);
    } catch (error) {
        console.error("Controller Error:", error.message);
        next(error);
    }
};

exports.deleteUser = async (req, res, next) =>{
    try {
        await userModel.deleteUser(req.params.id);
        res.json({message: "使用者已刪除"});
    } catch (error) {
        next(error);
    }
};