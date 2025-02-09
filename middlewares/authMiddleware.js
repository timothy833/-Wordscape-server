const jwt = require('jsonwebtoken');

module.exports = (req, res, next) =>{
    const tokenHeader = req.headers['authorization'];
    if (!tokenHeader || !tokenHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未授權，請提供有效的 Bearer token' });
    }
    const token = tokenHeader.split(' ')[1]; 

    if(!token) {
        return res.status(401).json({error: '未授權，請提供token'});
    }
    //可加token驗證邏輯(例如：jwt.verify())
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // 將解碼後的 payload 存入 req.user
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token 無效或已過期' });
    }
}