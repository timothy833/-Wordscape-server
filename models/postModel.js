const db = require('../db');

exports.getPosts = async () => {
  try {
    const postResult = await db.query(`
      SELECT posts.*, users.username AS author_name, 
             categories.id AS category_id, categories.name AS category_name,
             COUNT(post_likes.user_id) AS likes_count
      FROM posts
      JOIN users ON posts.user_id = users.id
      LEFT JOIN categories ON posts.category_id = categories.id
      LEFT JOIN post_likes ON posts.id = post_likes.post_id
      GROUP BY posts.id, users.username, categories.id, categories.name;
    `);

    const posts = postResult.rows;

    // 取得 `tags`
    const postIds = posts.map(post => post.id);
    const tagResult = await db.query(`
      SELECT post_tags.post_id, tags.id, tags.name
      FROM tags
      JOIN post_tags ON tags.id = post_tags.tag_id
      WHERE post_tags.post_id = ANY($1);
    `, [postIds]);

    const tagMap = {};
    tagResult.rows.forEach(tag => {
      if (!tagMap[tag.post_id]) tagMap[tag.post_id] = [];
      tagMap[tag.post_id].push({ id: tag.id, name: tag.name });
    });

    posts.forEach(post => {
      post.tags = tagMap[post.id] || [];
    });

    return posts;
  } catch (error) {
    throw error;
  }
};


exports.getPostById = async (id) => {
  try {
    const postResult = await db.query(`
      SELECT posts.*, users.username AS author_name, 
             categories.id AS category_id, categories.name AS category_name,
             COUNT(post_likes.user_id) AS likes_count
      FROM posts
      JOIN users ON posts.user_id = users.id
      LEFT JOIN categories ON posts.category_id = categories.id
      LEFT JOIN post_likes ON posts.id = post_likes.post_id
      WHERE posts.id = $1
      GROUP BY posts.id, users.username, categories.id, categories.name;
    `, [id]);

    if (postResult.rows.length === 0) return null;
    const post = postResult.rows[0];

    // 取得 `tags`
    const tagResult = await db.query(`
      SELECT tags.id, tags.name
      FROM tags
      JOIN post_tags ON tags.id = post_tags.tag_id
      WHERE post_tags.post_id = $1;
    `, [id]);

    post.tags = tagResult.rows;

    // 取得 `liked_users`
    const likedUsersResult = await db.query(`
      SELECT users.id, users.username
      FROM post_likes
      JOIN users ON post_likes.user_id = users.id
      WHERE post_likes.post_id = $1;
    `, [id]);

    post.liked_users = likedUsersResult.rows;

    return post;
  } catch (error) {
    throw error;
  }
};

exports.getPostsByCategory = async (categoryId) => {
  try {
    const postResult = await db.query(`
      SELECT posts.*, users.username AS author_name, 
             categories.id AS category_id, categories.name AS category_name,
             COUNT(post_likes.user_id) AS likes_count
      FROM posts
      JOIN users ON posts.user_id = users.id
      LEFT JOIN categories ON posts.category_id = categories.id
      LEFT JOIN post_likes ON posts.id = post_likes.post_id
      WHERE posts.category_id = $1
      GROUP BY posts.id, users.username, categories.id, categories.name;
    `, [categoryId]);

    const posts = postResult.rows;

    if (posts.length === 0) return posts;

    // 取得 `tags`
    const postIds = posts.map(post => post.id);
    const tagResult = await db.query(`
      SELECT post_tags.post_id, tags.id, tags.name
      FROM tags
      JOIN post_tags ON tags.id = post_tags.tag_id
      WHERE post_tags.post_id = ANY($1);
    `, [postIds]);

    const tagMap = {};
    tagResult.rows.forEach(tag => {
      if (!tagMap[tag.post_id]) tagMap[tag.post_id] = [];
      tagMap[tag.post_id].push({ id: tag.id, name: tag.name });
    });

    posts.forEach(post => {
      post.tags = tagMap[post.id] || [];
    });

    return posts;
  } catch (error) {
    throw error;
  }
};


exports.getPostsByUser = async (userId) => {
  try {
    const postResult = await db.query(`
      SELECT posts.*, users.username AS author_name, 
             categories.id AS category_id, categories.name AS category_name,
             COUNT(post_likes.user_id) AS likes_count
      FROM posts
      JOIN users ON posts.user_id = users.id
      LEFT JOIN categories ON posts.category_id = categories.id
      LEFT JOIN post_likes ON posts.id = post_likes.post_id
      WHERE posts.user_id = $1
      GROUP BY posts.id, users.username, categories.id, categories.name;
    `, [userId]);

    const posts = postResult.rows;
    if (posts.length === 0) return posts;

    // 取得 `tags`
    const postIds = posts.map(post => post.id);
    const tagResult = await db.query(`
      SELECT post_tags.post_id, tags.id, tags.name
      FROM tags
      JOIN post_tags ON tags.id = post_tags.tag_id
      WHERE post_tags.post_id = ANY($1);
    `, [postIds]);

    // 組織 `tags` 進入 `posts`
    const tagMap = {};
    tagResult.rows.forEach(tag => {
      if (!tagMap[tag.post_id]) tagMap[tag.post_id] = [];
      tagMap[tag.post_id].push({ id: tag.id, name: tag.name });
    });

    posts.forEach(post => {
      post.tags = tagMap[post.id] || [];
    });

    return posts;
  } catch (error) {
    throw error;
  }
};




exports.getFullPostsWithComments = async () => {
  try {
    const postResult = await db.query(`
      SELECT posts.*, users.username AS author_name, 
             categories.id AS category_id, categories.name AS category_name,
             COUNT(post_likes.user_id) AS likes_count
      FROM posts
      JOIN users ON posts.user_id = users.id
      LEFT JOIN categories ON posts.category_id = categories.id
      LEFT JOIN post_likes ON posts.id = post_likes.post_id
      GROUP BY posts.id, users.username, categories.id, categories.name;
    `);

    const posts = postResult.rows;

    // 取得 `tags`
    const postIds = posts.map(post => post.id);
    const tagResult = await db.query(`
      SELECT post_tags.post_id, tags.id, tags.name
      FROM tags
      JOIN post_tags ON tags.id = post_tags.tag_id
      WHERE post_tags.post_id = ANY($1);
    `, [postIds]);

    const tagMap = {};
    tagResult.rows.forEach(tag => {
      if (!tagMap[tag.post_id]) tagMap[tag.post_id] = [];
      tagMap[tag.post_id].push({ id: tag.id, name: tag.name });
    });

    posts.forEach(post => {
      post.tags = tagMap[post.id] || [];
    });

    return posts;
  } catch (error) {
    throw error;
  }
};





exports.createPost = async (postData, tagNames) => {
  try {
    const postResult = await db.query(`
          INSERT INTO posts (id, user_id, category_id, title, content, status)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *;
      `, [postData.id, postData.user_id, postData.category_id, postData.title, postData.content, postData.status]);

    const post = postResult.rows[0];

    if (tagNames && tagNames.length > 0) {
      const tags = await exports.addTagsToPost(post.id, tagNames);
      post.tags = tags;
    } else {
      post.tags = [];
    }

    return post;
  } catch (error) {
    throw error;
  }
};

exports.updatePost = async (id, data) => {
  try {
    const fields = [];
    const values = [];
    let index = 1;

    for (const key in data) {
      if (data[key]) {
        fields.push(`${key} = $${index}`);
        values.push(data[key]);
        index++;
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const result = await db.query(`
          UPDATE posts SET ${fields.join(", ")} WHERE id = $${index} RETURNING *;
      `, values);

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};



exports.deletePost = async (id) => {
  await db.query(`DELETE FROM posts WHERE id = $1`, [id]);
};

exports.addTagsToPost = async (post_id, tag_names) => {
  try {
    // 取得現有的 tags
    const existingTagsResult = await db.query(`
          SELECT id, name FROM tags WHERE name = ANY($1);
      `, [tag_names]);
    const existingTags = existingTagsResult.rows;

    // 找出需要新增的 tags
    const existingTagNames = existingTags.map(tag => tag.name);
    const newTagNames = tag_names.filter(name => !existingTagNames.includes(name));

    // 插入新的 tags
    let newTags = [];
    if (newTagNames.length > 0) {
      const newTagsResult = await db.query(`
              INSERT INTO tags (name)
              SELECT unnest($1::text[]) RETURNING id, name;
          `, [newTagNames]);
      newTags = newTagsResult.rows;
    }

    const allTags = [...existingTags, ...newTags];

    // 插入 post_tags 關聯
    const tagIds = allTags.map(tag => tag.id);
    await db.query(`
          INSERT INTO post_tags (post_id, tag_id)
          SELECT $1, unnest($2::uuid[]);
      `, [post_id, tagIds]);

    return allTags;
  } catch (error) {
    throw error;
  }
};

exports.searchPostsByTags = async (tag_names) => {
  try {
    const postsResult = await db.query(`
          SELECT DISTINCT posts.*, users.username AS author_name
          FROM posts
          JOIN users ON posts.user_id = users.id
          JOIN post_tags ON posts.id = post_tags.post_id
          JOIN tags ON post_tags.tag_id = tags.id
          WHERE tags.name = ANY($1)
          ORDER BY posts.created_at DESC;
      `, [tag_names]);

    const posts = postsResult.rows;
    if (posts.length === 0) return posts;

    // 取得 tags
    const postIds = posts.map(post => post.id);
    const tagResult = await db.query(`
          SELECT post_tags.post_id, tags.id, tags.name
          FROM tags
          JOIN post_tags ON tags.id = post_tags.tag_id
          WHERE post_tags.post_id = ANY($1);
      `, [postIds]);

    const tagMap = {};
    tagResult.rows.forEach(tag => {
      if (!tagMap[tag.post_id]) tagMap[tag.post_id] = [];
      tagMap[tag.post_id].push({ id: tag.id, name: tag.name });
    });

    posts.forEach(post => {
      post.tags = tagMap[post.id] || [];
    });

    return posts;
  } catch (error) {
    throw error;
  }
};

exports.togglePostLike = async (userId, postId) => {
  try {
    const likeCheck = await db.query(
      `SELECT * FROM post_likes WHERE user_id = $1 AND post_id = $2;`,
      [userId, postId]
    );

    if (likeCheck.rows.length > 0) {
      await db.query(`DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2;`, [userId, postId]);
      return { liked: false };
    } else {
      await db.query(`INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2);`, [userId, postId]);
      return { liked: true };
    }
  } catch (error) {
    throw error;
  }
};


exports.getPostLikes = async (post_id) => {
  try {
    const result = await db.query(`
          SELECT users.id, users.username
          FROM post_likes
          JOIN users ON post_likes.user_id = users.id
          WHERE post_likes.post_id = $1
      `, [post_id]);

    return result.rows;
  } catch (error) {
    throw error;
  }
};