const db = require('../config/db');

// Get all categories with active product count
async function getCategories(req, res) {
  try {
    const result = await db.query(`
      SELECT 
        c.id, 
        c.name, 
        c.description, 
        c.icon,
        COUNT(p.id) FILTER (WHERE p.status = 'ACTIVE' AND (u.is_banned IS FALSE OR u.is_banned IS NULL)) AS active_products_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN users u ON p.seller_id = u.id
      GROUP BY c.id, c.name, c.description, c.icon
      ORDER BY c.name ASC
    `);

    res.json({ categories: result.rows });
  } catch (err) {
    console.error('getCategories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
}

module.exports = {
  getCategories
};
