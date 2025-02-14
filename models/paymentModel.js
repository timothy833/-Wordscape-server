const db = require('../db');

exports.createPayment = async (user_id, amount, status) => {
  try {
    const result = await db.query(`
            INSERT INTO payments (id, user_id, amount, status, created_at)
            VALUES (gen_random_uuid(), $1, $2, $3, NOW()) RETURNING *;
        `, [user_id, amount, status]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

exports.getAllPayments = async () => {
  try {
    const result = await db.query(`SELECT * FROM payments ORDER BY created_at DESC;`);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

exports.getPaymentsByUser = async (userId) => {
  try {
    const result = await db.query(`SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC;`, [userId]);
    return result.rows;
  } catch (error) {
    throw error;
  }
};
