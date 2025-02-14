const commentModel = require('../models/commentModel');


exports.getAllComments = async (req, res) => {
  try {
    const comments = await commentModel.getAllComments();
    res.json({ status: "success", data: comments });
  } catch (error) {
    console.error("無法取得所有留言:", error);
    res.status(500).json({ status: "error", message: "無法取得所有留言" });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { post_id } = req.params;
    const comments = await commentModel.getCommentsWithReplies(post_id);
    res.json({ status: "success", data: comments });
  } catch (error) {
    console.error("無法取得留言:", error);
    res.status(500).json({ status: "error", message: "無法取得留言" });
  }
};

exports.createComment = async (req, res) => {
  try {
    const { post_id, parent_comment_id, content } = req.body;
    const user_id = req.user.id;
    if (!post_id || !content) {
      return res.status(400).json({ status: "error", message: "缺少必要欄位" });
    }

    const newComment = await commentModel.createComment(post_id, parent_comment_id, user_id, content);
    res.status(201).json({ status: "success", data: newComment });
  } catch (error) {
    console.error("無法新增留言:", error);
    res.status(500).json({ status: "error", message: "無法新增留言" });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const user_id = req.user.id;

    if (!content) {
      return res.status(400).json({ status: "error", message: "請提供留言內容" });
    }

    const comment = await commentModel.getCommentById(id);
    if (!comment) {
      return res.status(404).json({ status: "error", message: "留言不存在" });
    }
    if (comment.user_id !== user_id) {
      return res.status(403).json({ status: "error", message: "無權修改該留言" });
    }

    const updatedComment = await commentModel.updateComment(id, content);
    res.json({ status: "success", data: updatedComment });
  } catch (error) {
    console.error("修改留言失敗:", error);
    res.status(500).json({ status: "error", message: "無法修改留言" });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const comment = await commentModel.getCommentById(id);
    if (!comment) {
      return res.status(404).json({ status: "error", message: "留言不存在" });
    }
    if (comment.user_id !== user_id) {
      return res.status(403).json({ status: "error", message: "無權刪除該留言" });
    }

    await commentModel.deleteComment(id);
    res.json({ status: "success", message: "留言已刪除" });
  } catch (error) {
    console.error("刪除留言失敗:", error);
    res.status(500).json({ status: "error", message: "無法刪除留言" });
  }
};
