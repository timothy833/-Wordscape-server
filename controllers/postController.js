const postModel = require('../models/postModel');
const { v4: uuidv4 } = require('uuid');


exports.getPosts = async (req, res) => {
  try {
    const posts = await postModel.getPosts();
    res.json({ status: "success", data: posts });
  } catch (error) {
    console.error("無法取得文章列表:", error);
    res.status(500).json({ status: "error", message: "無法取得文章" });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await postModel.getPostById(id);
    if (!post) {
      return res.status(404).json({ status: "error", message: "文章不存在" });
    }
    res.json({ status: "success", data: post });
  } catch (error) {
    console.error("無法取得文章:", error);
    res.status(500).json({ status: "error", message: "無法取得文章" });
  }
};

exports.getPostsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const posts = await postModel.getPostsByCategory(categoryId);
    if (posts.length === 0) {
      return res.status(404).json({ status: "error", message: "此分類下沒有文章" });
    }
    res.json({ status: "success", data: posts });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法取得分類文章" });
  }
};

exports.getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await postModel.getPostsByUser(userId);
    res.json({ status: "success", data: posts });
  } catch (error) {
    console.error("無法取得使用者文章:", error);
    res.status(500).json({ status: "error", message: "無法取得使用者文章" });
  }
};

exports.getFullPostsWithComments = async (req, res) => {
  try {
    const posts = await postModel.getFullPostsWithComments();
    res.json({ status: "success", data: posts });
  } catch (error) {
    console.error("無法取得完整文章列表:", error);
    res.status(500).json({ status: "error", message: "無法取得完整文章列表" });
  }
};

exports.createPost = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ status: "error", message: "未授權，請登入" });
    }

    const { title, content, category_id, status, tags } = req.body;

    const postData = {
      id: uuidv4(),
      user_id: req.user.id,
      category_id,
      title,
      content,
      status: status || 'draft'
    };

    const newPost = await postModel.createPost(postData, tags);
    res.status(201).json({ status: "success", data: newPost });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法新增文章" });
  }
};


exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const updatedPost = await postModel.updatePost(id, { title, content });

    if (!updatedPost) {
      return res.status(404).json({ status: "error", message: "文章不存在" });
    }

    res.json({ status: "success", data: updatedPost });
  } catch (error) {
    console.error("更新文章失敗:", error);
    res.status(500).json({ status: "error", message: "無法更新文章" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const deletedPost = await postModel.getPostById(req.params.id);
    if (!deletedPost) return res.status(404).json({ status: "error", message: "找不到文章" });

    await postModel.deletePost(req.params.id);
    res.json({ status: "success", message: "文章已刪除" });
  } catch (error) {
    console.error("刪除文章失敗:", error);
    res.status(500).json({ status: "error", message: "無法刪除文章" });
  }
};

exports.addTagsToPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ status: "error", message: "請提供有效的標籤陣列" });
    }

    const addedTags = await postModel.addTagsToPost(id, tags);
    res.json({ status: "success", data: { post_id: id, tags: addedTags } });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法新增標籤" });
  }
};

exports.searchPostsByTags = async (req, res) => {
  try {
    const { tags } = req.query;
    if (!tags) {
      return res.status(400).json({ status: "error", message: "請提供標籤參數" });
    }

    const tagArray = tags.split(',');
    const posts = await postModel.searchPostsByTags(tagArray);
    res.json({ status: "success", data: posts });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法搜尋文章" });
  }
};

exports.togglePostLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId) {
      return res.status(400).json({ status: "error", message: "缺少 postId" });
    }

    const result = await postModel.togglePostLike(userId, postId);
    res.json({ status: "success", liked: result.liked });
  } catch (error) {
    console.error("按讚失敗:", error);
    res.status(500).json({ status: "error", message: "操作失敗" });
  }
};

exports.getPostLikes = async (req, res) => {
  try {
    const { post_id } = req.params;
    const likes = await postModel.getPostLikes(post_id);

    if (!likes) {
      return res.status(404).json({ status: "error", message: "找不到該文章的按讚數" });
    }

    res.json({ status: "success", data: likes });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法查詢按讚數" });
  }
};
