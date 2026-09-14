const db = require('../config/db');

// Get user notifications
async function getNotifications(req, res) {
  try {
    const userId = req.user.id;

    const notifRes = await db.query(
      `SELECT id, type, title, message, link, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    const countRes = await db.query(
      'SELECT COUNT(*) AS unread FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );

    res.json({
      notifications: notifRes.rows,
      unreadCount: parseInt(countRes.rows[0]?.unread || 0, 10)
    });
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
}

// Mark single notification as read
async function markAsRead(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ error: 'Failed to update notification.' });
  }
}

// Mark all notifications as read
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;

    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [userId]
    );

    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('markAllAsRead error:', err);
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
