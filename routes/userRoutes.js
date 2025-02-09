const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

//註冊
router.post('/register', userController.register);
//登入
router.post('/login', userController.login);
//取得所有使用者
router.get('/',userController.getUsers);
//取得單一使用者
router.get('/:id', userController.getUser);
//更新使用者
router.put('/:id', userController.updateUser);
//刪除使用者
router.delete('/:id', userController.deleteUser);

module.exports = router;