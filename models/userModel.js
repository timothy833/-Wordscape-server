const db = require('../db');
const bcrypt = require('bcrypt'); //用於密碼加密

exports.getAllUsers = async ()=>{
    const result = await db.query('SELECT * FROM users');
    return result.rows;
};

exports.getUserById = async (id) =>{
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
};

exports.getUserByEmail = async(email) => {
    const result = await db.query(`
        SELECT * FROM users WHERE email = $1
    `, [email]);
    return result.rows[0];
}

exports.createUser = async(user) =>{
    try {
        const {username, email, password, bio, profile_picture } = user;
        // 檢查是否缺少必要欄位
        let missingFields = [];
        if (!username) missingFields.push("username");
        if (!email) missingFields.push("email");
        if (!password) missingFields.push("password");

        // ✅ `bio` 和 `profile_picture` 可以為空，不應該影響檢查
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
        }
       //將密碼加密
       const hashedPassword = await bcrypt.hash(password, 10);
       const result = await db.query(`
           INSERT INTO users(username, email, password, bio, profile_picture)
           VALUES ($1, $2, $3, $4, $5) RETURNING * `,
           [username, email, hashedPassword, bio || '', profile_picture || '']
       );

       return result.rows[0];
    } catch (error) {
        console.error("Error creating user:", error);
        throw error; // 讓 `register` 方法處理錯誤
    }
   
}

exports.updateUser = async (id, user)=>{
    try {
        const {username, email, bio, profile_picture } = user;
        const result = await db.query(`
            UPDATE users SET username = $1, email= $2, bio= $3, profile_picture= $4
            WHERE id = $5 RETURNING id, username, email, bio, profile_picture;`,
            [username, email, bio, profile_picture, id]
        );
        if (result.rows.length === 0) {
            throw new Error("User not found");
        }
        return result.rows[0];
    } catch (error) {
        console.error("Error updating user:", error);
        throw error; // 讓上層函式（如 `controller`）處理錯誤
    }
   
};

exports.deleteUser = async (id) => {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
};

