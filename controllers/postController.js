const postModel = require('../models/postModel');
const { v4: uuidv4 } = require('uuid');

exports.getPosts = async(req, res, next)=>{
    try{
        const posts = await postModel.getPosts();
        res.json(posts);
    } catch (error) {
        next(error);
    }
};

exports.getPost = async (req, res, next) => {
    try {
        const post = await postModel.getPostById(req.params.id);
        if(!post) return res.status(404).json({error: '找不到文章'});
        res.json(post);
    } catch (error) {
        next(error);
    }
};


exports.getPostsByUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!userId.match(/^[0-9a-fA-F-]{36}$/)) {
            return res.status(400).json({ error: "Invalid UUID format" });
        }

        const posts = await postModel.getPostsByUser(userId);
        res.json(posts);
    } catch (error) {
        next(error);
    }
};

exports.createPost = async (req, res, next) => {
    try {

        //req.user 來自 authMiddleware，如果請求沒有 JWT Token，就不會有 req.user，這可能會導致 Cannot read property 'id' of undefined。
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: '未授權，請登入' });
        }

        //假設使用authMiddleware 後 req.user 中存有使用者id
        const postData = {
            id: uuidv4(),  // 手動生成 UUID
            user_id: req.user.id, //  `user_id` 是 UUID
            category_id: req.body.category_id,
            title: req.body.title,
            content: req.body.content,
            status: req.body.status || 'draft'
        };
        const newPost = await postModel.createPost(postData);
        res.status(201).json(newPost);
    } catch (error) {
        next(error);
    }
};

exports.updatePost = async (req, res, next) => {
    try {
        const updatePost = await postModel.updatePost(req.params.id, req.body);
        if (!updatePost) return res.status(404).json({ error: '找不到文章' });
        res.json(updatePost);
    } catch (error) {
        next(error);
    }
};

exports.deletePost = async (req, res, next) => {
    try {
        const deletedPost = await postModel.getPostById(req.params.id);
        if (!deletedPost) return res.status(404).json({ error: '找不到文章' });

        await postModel.deletePost(req.params.id);
        res.json({message:'文章已刪除'});
    } catch (error) {
        next(error);
    }
};