const express = require('express');
const postController = require('../controllers/postController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', postController.getPosts);
router.get('/full', postController.getFullPostsWithComments);
router.get('/:id', postController.getPostById);
router.get('/search', postController.searchPostsByTags);
router.get('/user/:userId', postController.getPostsByUser);
router.get('/category/:categoryId', postController.getPostsByCategory);
router.get('/post_likes/:post_id', postController.getPostLikes);

router.post('/', authMiddleware, postController.createPost);
router.post('/:id/tags', authMiddleware, postController.addTagsToPost);
router.post("/post_likes/:postId", authMiddleware, postController.togglePostLike);

router.patch('/:id', authMiddleware, postController.updatePost);
router.delete('/:id', authMiddleware, postController.deletePost);

module.exports = router;
