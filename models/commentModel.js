const db = require('../db');

exports.getAllComments = async () => {
  const result = await db.query('SELECT * FROM comments ORDER BY created_at DESC;');
  return result.rows;
}

exports.getCommentsByPostId = async (post_id) => {
  const result = await db.query('SELECT * FROM comments WHERE post_id = $1', [post_id]);
  return result.rows;
};

exports.getCommentById = async (id) => {
  try {
    const result = await db.query(`
          SELECT * FROM comments WHERE id = $1;
      `, [id]);

    return result.rows[0];
  } catch (error) {
    console.error("取得留言時發生錯誤:", error);
    throw error;
  }
};

exports.getCommentsWithReplies = async (post_id) => {
  try {
    const result = await db.query(`
          SELECT comments.*, users.username AS user_name
          FROM comments
          JOIN users ON comments.user_id = users.id
          WHERE comments.post_id = $1
          ORDER BY comments.created_at ASC;
      `, [post_id]);

    const comments = result.rows;

    const commentMap = {};
    comments.forEach(comment => commentMap[comment.id] = { ...comment, replies: [] });

    const nestedComments = [];
    comments.forEach(comment => {
      if (comment.parent_comment_id) {
        commentMap[comment.parent_comment_id]?.replies.push(commentMap[comment.id]);
      } else {
        nestedComments.push(commentMap[comment.id]);
      }
    });

    return nestedComments;
  } catch (error) {
    console.error("無法取得留言:", error);
    throw error;
  }
};


exports.createComment = async (post_id, parent_comment_id, user_id, content) => {
  try {
    const result = await db.query(`
          INSERT INTO comments (post_id, parent_comment_id, user_id, content)
          VALUES ($1, $2, $3, $4) RETURNING *;
      `, [post_id, parent_comment_id, user_id, content]);

    return result.rows[0];
  } catch (error) {
    console.error("無法新增留言:", error);
    throw error;
  }
};

exports.updateComment = async (id, content) => {
  try {
    const result = await db.query(`
          UPDATE comments SET content = $1, updated_at = NOW()
          WHERE id = $2 RETURNING *;
      `, [content, id]);

    return result.rows[0];
  } catch (error) {
    console.error("無法修改留言:", error);
    throw error;
  }
};

exports.deleteComment = async (id) => {
  await db.query(`DELETE FROM comments WHERE id = $1`, [id]);
};