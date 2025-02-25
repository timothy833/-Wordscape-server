const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// ✅ 註冊與登入（不需要 JWT 驗證）
//註冊
router.post('/register', userController.register);
//登入
router.post('/login', userController.login);

//使用者管理 （需要 `authMiddleware` 驗證）
//取得所有使用者
router.get('/', authMiddleware,userController.getUsers);
//取得單一使用者
router.get('/:id',authMiddleware ,userController.getUser);
//更新使用者
router.put('/:id',authMiddleware ,userController.updateUser);
//刪除使用者
router.delete('/:id',authMiddleware ,userController.deleteUser);

//密碼管理 （不需要 JWT，因為 Token 來自 Email）
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);


module.exports = router;