const db = require('../config/db');

// Get user's wishlist
async function getWishlist(req, res) {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT 
        w.id AS wishlist_id,
        w.created_at AS added_at,
        p.id AS product_id,
        p.name,
        p.description,
        p.price,
        p.condition,
        p.location,
        p.status,
        c.name AS category_name,
        u.id AS seller_id,
        u.name AS seller_name,
        u.email AS seller_email,
        u.is_banned AS seller_is_banned,
        COALESCE(
          (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id ASC LIMIT 1),
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'
        ) AS primary_image
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       JOIN users u ON p.seller_id = u.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [userId]
    );

    res.json({ wishlist: result.rows });
  } catch (err) {
    console.error('getWishlist error:', err);
    res.status(500).json({ error: 'Failed to fetch wishlist.' });
  }
}

// Toggle wishlist item (add if not present, remove if present)
async function toggleWishlist(req, res) {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    // Check product exists
    const prodRes = await db.query('SELECT id, name FROM products WHERE id = $1', [productId]);
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const existing = await db.query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    if (existing.rows.length > 0) {
      // Remove
      await db.query('DELETE FROM wishlist WHERE id = $1', [existing.rows[0].id]);
      return res.json({
        message: 'Removed from wishlist.',
        isWishlisted: false
      });
    } else {
      // Add
      await db.query(
        'INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, productId]
      );
      return res.status(201).json({
        message: 'Added to wishlist.',
        isWishlisted: true
      });
    }
  } catch (err) {
    console.error('toggleWishlist error:', err);
    res.status(500).json({ error: 'Failed to update wishlist.' });
  }
}

module.exports = {
  getWishlist,
  toggleWishlist
};
