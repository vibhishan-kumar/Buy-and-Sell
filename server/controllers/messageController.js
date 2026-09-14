const db = require('../config/db');
const { emitToUser, emitToConversation } = require('../services/socketService');
const { createNotification } = require('../services/notificationService');

// Get all conversations for current user
async function getConversations(req, res) {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT 
        c.id,
        c.product_id,
        c.updated_at,
        p.name AS product_name,
        p.price AS product_price,
        p.status AS product_status,
        COALESCE(
          (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id ASC LIMIT 1),
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'
        ) AS product_image,
        other_user.id AS other_user_id,
        other_user.name AS other_user_name,
        other_user.email AS other_user_email,
        other_user.department AS other_user_department,
        other_user.profile_image AS other_user_image,
        other_user.is_banned AS other_user_banned,
        last_msg.message_text AS last_message,
        last_msg.created_at AS last_message_time,
        last_msg.sender_id AS last_message_sender_id,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.is_read = FALSE AND m.sender_id != $1) AS unread_count
      FROM conversations c
      LEFT JOIN products p ON c.product_id = p.id
      JOIN users other_user ON (
        CASE 
          WHEN c.buyer_id = $1 THEN c.seller_id = other_user.id 
          ELSE c.buyer_id = other_user.id 
        END
      )
      LEFT JOIN LATERAL (
        SELECT message_text, created_at, sender_id
        FROM messages 
        WHERE conversation_id = c.id 
        ORDER BY created_at DESC 
        LIMIT 1
      ) last_msg ON TRUE
      WHERE c.buyer_id = $1 OR c.seller_id = $1
      ORDER BY COALESCE(last_msg.created_at, c.updated_at) DESC`,
      [userId]
    );

    res.json({ conversations: result.rows });
  } catch (err) {
    console.error('getConversations error:', err);
    res.status(500).json({ error: 'Failed to retrieve conversations.' });
  }
}

// Start or retrieve conversation for a product
async function startConversation(req, res) {
  try {
    const buyerId = req.user.id;
    const { productId, sellerId } = req.body;

    if (!sellerId) {
      return res.status(400).json({ error: 'Seller ID is required.' });
    }

    if (buyerId === parseInt(sellerId, 10)) {
      return res.status(400).json({ error: 'You cannot initiate a conversation with yourself.' });
    }

    // Check if seller is banned
    const sellerRes = await db.query('SELECT is_banned, name FROM users WHERE id = $1', [sellerId]);
    if (sellerRes.rows.length === 0) {
      return res.status(404).json({ error: 'Seller not found.' });
    }
    if (sellerRes.rows[0].is_banned) {
      return res.status(403).json({ error: 'Cannot message this user as their account is currently suspended.' });
    }

    // Check existing conversation
    let convRes;
    if (productId) {
      convRes = await db.query(
        `SELECT id FROM conversations 
         WHERE product_id = $1 AND ((buyer_id = $2 AND seller_id = $3) OR (buyer_id = $3 AND seller_id = $2))`,
        [productId, buyerId, sellerId]
      );
    } else {
      convRes = await db.query(
        `SELECT id FROM conversations 
         WHERE (buyer_id = $1 AND seller_id = $2) OR (buyer_id = $2 AND seller_id = $1)`,
        [buyerId, sellerId]
      );
    }

    if (convRes.rows.length > 0) {
      return res.json({ conversationId: convRes.rows[0].id });
    }

    // Create new conversation
    const newConv = await db.query(
      `INSERT INTO conversations (product_id, buyer_id, seller_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [productId || null, buyerId, sellerId]
    );

    res.status(201).json({ conversationId: newConv.rows[0].id });
  } catch (err) {
    console.error('startConversation error:', err);
    res.status(500).json({ error: 'Failed to start conversation.' });
  }
}

// Get messages for a specific conversation
async function getMessages(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify user is participant
    const convRes = await db.query(
      'SELECT buyer_id, seller_id FROM conversations WHERE id = $1',
      [id]
    );

    if (convRes.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const { buyer_id, seller_id } = convRes.rows[0];
    if (buyer_id !== userId && seller_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to view this conversation.' });
    }

    // Mark messages as read where current user is recipient
    await db.query(
      'UPDATE messages SET is_read = TRUE WHERE conversation_id = $1 AND sender_id != $2 AND is_read = FALSE',
      [id, userId]
    );

    // Fetch messages
    const messagesRes = await db.query(
      `SELECT m.id, m.conversation_id, m.sender_id, m.message_text, m.is_read, m.created_at,
              u.name AS sender_name, u.profile_image AS sender_image
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [id]
    );

    res.json({ messages: messagesRes.rows });
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
}

// Send a message
async function sendMessage(req, res) {
  try {
    const senderId = req.user.id;
    const { id } = req.params; // conversationId
    const { messageText } = req.body;

    if (!messageText || !messageText.trim()) {
      return res.status(400).json({ error: 'Message text cannot be empty.' });
    }

    // Verify participant
    const convRes = await db.query(
      `SELECT c.id, c.buyer_id, c.seller_id, c.product_id, p.name AS product_name
       FROM conversations c
       LEFT JOIN products p ON c.product_id = p.id
       WHERE c.id = $1`,
      [id]
    );

    if (convRes.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const conv = convRes.rows[0];
    if (conv.buyer_id !== senderId && conv.seller_id !== senderId) {
      return res.status(403).json({ error: 'You are not a participant in this conversation.' });
    }

    const recipientId = conv.buyer_id === senderId ? conv.seller_id : conv.buyer_id;

    // Check if recipient is banned
    const recipientCheck = await db.query('SELECT is_banned FROM users WHERE id = $1', [recipientId]);
    if (recipientCheck.rows[0]?.is_banned) {
      return res.status(403).json({ error: 'Cannot send message. The recipient is suspended.' });
    }

    // Insert message
    const msgRes = await db.query(
      `INSERT INTO messages (conversation_id, sender_id, message_text, is_read)
       VALUES ($1, $2, $3, FALSE)
       RETURNING *`,
      [id, senderId, messageText.trim()]
    );

    const message = msgRes.rows[0];

    // Update conversation timestamp
    await db.query('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);

    const enrichedMessage = {
      ...message,
      sender_name: req.user.name,
      sender_image: req.user.profile_image
    };

    // Real-time broadcast to conversation room
    emitToConversation(id, 'new_message', enrichedMessage);

    // Direct notification to recipient
    emitToUser(recipientId, 'message_notification', {
      conversationId: id,
      message: enrichedMessage,
      productName: conv.product_name
    });

    // Create DB notification
    await createNotification({
      userId: recipientId,
      type: 'NEW_MESSAGE',
      title: `New message from ${req.user.name}`,
      message: messageText.trim().length > 60 ? `${messageText.trim().substring(0, 60)}...` : messageText.trim(),
      link: `/messages?conv=${id}`
    });

    res.status(201).json({ message: enrichedMessage });
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
}

module.exports = {
  getConversations,
  startConversation,
  getMessages,
  sendMessage
};
