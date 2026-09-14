const db = require('../config/db');
const { createNotification } = require('../services/notificationService');

// Submit review for completed order
async function createReview(req, res) {
  try {
    const buyerId = req.user.id;
    const { orderId, rating, reviewText } = req.body;

    if (!orderId || !rating) {
      return res.status(400).json({ error: 'Order ID and rating are required.' });
    }

    const numericRating = parseInt(rating, 10);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    // Verify order exists, belongs to buyer, and is COMPLETED
    const orderRes = await db.query(
      `SELECT o.id, o.seller_id, o.buyer_id, o.status, p.name AS product_name
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderRes.rows[0];

    if (order.buyer_id !== buyerId) {
      return res.status(403).json({ error: 'Only the verified buyer of this order can submit a review.' });
    }

    if (order.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Reviews can only be submitted for completed orders.' });
    }

    // Check if review already exists for this order
    const existingReview = await db.query('SELECT id FROM reviews WHERE order_id = $1', [orderId]);
    if (existingReview.rows.length > 0) {
      return res.status(400).json({ error: 'You have already submitted a review for this purchase.' });
    }

    // Insert review
    const insertRes = await db.query(
      `INSERT INTO reviews (order_id, seller_id, buyer_id, rating, review_text)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [orderId, order.seller_id, buyerId, numericRating, reviewText ? reviewText.trim() : '']
    );

    const review = insertRes.rows[0];

    // Notify seller
    await createNotification({
      userId: order.seller_id,
      type: 'NEW_REVIEW',
      title: 'New Rating & Review Received!',
      message: `${req.user.name} gave you a ${numericRating}-star review for "${order.product_name}".`,
      link: `/profile`
    });

    res.status(201).json({
      message: 'Review submitted successfully!',
      review
    });
  } catch (err) {
    console.error('createReview error:', err);
    res.status(500).json({ error: 'Failed to submit review.' });
  }
}

// Get reviews for a seller
async function getSellerReviews(req, res) {
  try {
    const { sellerId } = req.params;

    const reviewsRes = await db.query(
      `SELECT r.id, r.order_id, r.rating, r.review_text, r.created_at,
              b.id AS buyer_id, b.name AS buyer_name, b.department AS buyer_department, b.profile_image AS buyer_image,
              p.name AS product_name
       FROM reviews r
       JOIN users b ON r.buyer_id = b.id
       JOIN orders o ON r.order_id = o.id
       JOIN products p ON o.product_id = p.id
       WHERE r.seller_id = $1
       ORDER BY r.created_at DESC`,
      [sellerId]
    );

    const statsRes = await db.query(
      `SELECT 
        COALESCE(ROUND(AVG(rating), 1), 0) AS avg_rating,
        COUNT(*) AS total_reviews
       FROM reviews
       WHERE seller_id = $1`,
      [sellerId]
    );

    res.json({
      reviews: reviewsRes.rows,
      stats: {
        avgRating: parseFloat(statsRes.rows[0]?.avg_rating || 0),
        totalReviews: parseInt(statsRes.rows[0]?.total_reviews || 0, 10)
      }
    });
  } catch (err) {
    console.error('getSellerReviews error:', err);
    res.status(500).json({ error: 'Failed to retrieve seller reviews.' });
  }
}

module.exports = {
  createReview,
  getSellerReviews
};
