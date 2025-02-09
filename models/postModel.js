const db = require('../db');

exports.getAllPosts = async ()=>{
    const result = await db.query('SELECT * FROM posts');
    return result.rows;
}

exports.getPostById = async (id) =>{
    const result = await db.query('SELECT * FROM posts WHERE id = $1', [id]);
     // result.rows 是一個陣列，裡面存放查詢結果的每一筆資料，RETURNING * 代表返回剛剛插入的那筆資料
    return result.rows[0];
};

exports.getPostsByUser = async (userId) => {
    const result = await db.query('SELECT * FROM posts WHERE user_id = $1', [userId]);
    return result.rows;
};


exports.createPost = async (post) => {
    // 從post 物件中解構各參數
    const {user_id, category_id, title, content, status} = post;
    const result = await db.query(`
        INSERT INTO posts(user_id, category_id, title, content, status)
        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [user_id, category_id, title, content, status]
    );
    return result.rows[0];
};

exports.updatePost = async (id, post) => {
    const { category_id, title, content, status } = post;
    const result = await db.query(`
        UPDATE posts SET category_id = $1, title = $2, content = $3, status = $4,
               updated_at = CURRENT_TIMESTAMP
        WHERE id = $5 RETURNING * `,
        [category_id, title, content, status, id]
    );
    return result.rows[0];
};


exports.deletePost = async (id) => {
    await db.query(`DELETE FROM posts WHERE id = $1`, [id]);
};