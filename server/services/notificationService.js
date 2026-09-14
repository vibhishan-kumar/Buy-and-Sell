const db = require('../config/db');
const { emitToUser } = require('./socketService');

async function createNotification({ userId, type, title, message, link = null }) {
  try {
    const res = await db.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, title, message, link]
    );

    const notification = res.rows[0];

    // Emit real-time notification
    emitToUser(userId, 'new_notification', notification);

    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
}

module.exports = {
  createNotification
};
