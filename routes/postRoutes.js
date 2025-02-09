const express = require('express');
const router  = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middlewares/authMiddleware')

//可依需求加上authMiddleware 保護部分API
// const authMiddleware = require('../midddlewares/authMiddleware');
//router.use(authMiddleware);

//取得所有文章
router.get('/', postController.getPosts);
//取得單一文章
router.get('/:id', postController.getPost);

//找到「某個用戶的所有文章」
router.get('/user/:userId', postController.getPostsByUser);


// 下列 API 需透過 authMiddleware 驗證，確保只有登入使用者能發文、更新、刪除
//建立文章
router.post('/', authMiddleware, postController.createPost);
//更新文章
router.put('/:id', authMiddleware, postController.updatePost);
//刪除文章
router.delete('/:id', authMiddleware, postController.deletePost);

module.exports = router;