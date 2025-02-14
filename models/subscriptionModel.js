const db = require('../db');

exports.createSubscription = async (user_id, subscribed_to) => {
  try {
    const checkResult = await db.query(`
            SELECT * FROM subscriptions WHERE user_id = $1 AND subscribed_to = $2
        `, [user_id, subscribed_to]);

    if (checkResult.rows.length > 0) {
      throw new Error("已訂閱過該使用者");
    }

    const result = await db.query(`
            INSERT INTO subscriptions (id, user_id, subscribed_to, created_at)
            VALUES (gen_random_uuid(), $1, $2, NOW()) RETURNING *;
        `, [user_id, subscribed_to]);

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

exports.getSubscriptionsByUser = async (userId) => {
  try {
    const result = await db.query(`
          SELECT subscriptions.*, users.username AS subscribed_to_name
          FROM subscriptions
          JOIN users ON subscriptions.subscribed_to = users.id
          WHERE subscriptions.user_id = $1;
      `, [userId]);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

exports.getFollowersByUser = async (userId) => {
  try {
    const result = await db.query(`
          SELECT subscriptions.id, subscriptions.user_id, 
                 users.username AS follower_name
          FROM subscriptions
          JOIN users ON subscriptions.user_id = users.id
          WHERE subscriptions.subscribed_to = $1;
      `, [userId]);
    return result.rows;
  } catch (error) {
    throw error;
  }
};


exports.deleteSubscription = async (id) => {
  try {
    await db.query(`DELETE FROM subscriptions WHERE id = $1;`, [id]);
  } catch (error) {
    throw error;
  }
};
