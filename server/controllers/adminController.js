const db = require('../config/db');

// Helper to log admin actions
async function logAdminAction(adminId, action, targetType, targetId, description) {
  try {
    await db.query(
      `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, action, targetType, targetId || null, description]
    );
  } catch (err) {
    console.error('Failed to write admin log:', err);
  }
}

// 1. Get Platform Statistics
async function getPlatformStats(req, res) {
  try {
    const statsRes = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'student') AS total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'student' AND is_banned = FALSE) AS active_users,
        (SELECT COUNT(*) FROM users WHERE role = 'student' AND is_banned = TRUE) AS banned_users,
        (SELECT COUNT(*) FROM products) AS total_products,
        (SELECT COUNT(*) FROM products WHERE status = 'ACTIVE') AS active_products,
        (SELECT COUNT(*) FROM products WHERE status = 'DELISTED') AS delisted_products,
        (SELECT COUNT(*) FROM products WHERE status = 'SOLD') AS sold_products,
        (SELECT COUNT(*) FROM orders) AS total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'COMPLETED') AS total_volume,
        (SELECT COUNT(*) FROM categories) AS total_categories
    `);

    const recentLogs = await db.query(`
      SELECT l.id, l.action, l.target_type, l.target_id, l.description, l.created_at,
             u.name AS admin_name, u.email AS admin_email
      FROM admin_activity_logs l
      LEFT JOIN users u ON l.admin_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 6
    `);

    const stats = statsRes.rows[0];

    res.json({
      metrics: {
        totalUsers: parseInt(stats.total_users, 10),
        activeUsers: parseInt(stats.active_users, 10),
        bannedUsers: parseInt(stats.banned_users, 10),
        totalProducts: parseInt(stats.total_products, 10),
        activeProducts: parseInt(stats.active_products, 10),
        delistedProducts: parseInt(stats.delisted_products, 10),
        soldProducts: parseInt(stats.sold_products, 10),
        totalOrders: parseInt(stats.total_orders, 10),
        totalVolume: parseFloat(stats.total_volume),
        totalCategories: parseInt(stats.total_categories, 10)
      },
      recentActivity: recentLogs.rows
    });
  } catch (err) {
    console.error('getPlatformStats error:', err);
    res.status(500).json({ error: 'Failed to compute platform metrics.' });
  }
}

// 2. Get All Users (with search, filter, listing counts)
async function getUsers(req, res) {
  try {
    const { q, status } = req.query;

    const conditions = ["u.role = 'student'"];
    const params = [];
    let paramIdx = 1;

    if (q && q.trim()) {
      conditions.push(`(u.name ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx} OR u.department ILIKE $${paramIdx})`);
      params.push(`%${q.trim()}%`);
      paramIdx++;
    }

    if (status === 'banned') {
      conditions.push('u.is_banned = TRUE');
    } else if (status === 'active') {
      conditions.push('u.is_banned = FALSE');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.department,
        u.phone,
        u.profile_image,
        u.role,
        u.is_banned,
        u.created_at,
        (SELECT COUNT(*) FROM products WHERE seller_id = u.id) AS listings_count,
        (SELECT COUNT(*) FROM orders WHERE buyer_id = u.id AND status = 'COMPLETED') AS purchases_count,
        COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE seller_id = u.id), 0) AS avg_rating
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
    `;

    const result = await db.query(query, params);
    res.json({ users: result.rows });
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
}

// 3. Ban User
async function banUser(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const userRes = await db.query('SELECT id, name, email, role, is_banned FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const targetUser = userRes.rows[0];
    if (targetUser.role === 'admin') {
      return res.status(400).json({ error: 'Cannot ban an administrative account.' });
    }

    await db.query('UPDATE users SET is_banned = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);

    await logAdminAction(
      adminId,
      'BAN_USER',
      'USER',
      id,
      `Suspended student account for ${targetUser.name} (${targetUser.email})`
    );

    res.json({
      message: `User ${targetUser.name} has been banned successfully. Their listings are now hidden from marketplace.`,
      is_banned: true
    });
  } catch (err) {
    console.error('banUser error:', err);
    res.status(500).json({ error: 'Failed to ban user.' });
  }
}

// 4. Unban User
async function unbanUser(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const userRes = await db.query('SELECT id, name, email FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const targetUser = userRes.rows[0];

    await db.query('UPDATE users SET is_banned = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);

    await logAdminAction(
      adminId,
      'UNBAN_USER',
      'USER',
      id,
      `Restored student account for ${targetUser.name} (${targetUser.email})`
    );

    res.json({
      message: `User ${targetUser.name} has been unbanned. Their account and listings are restored.`,
      is_banned: false
    });
  } catch (err) {
    console.error('unbanUser error:', err);
    res.status(500).json({ error: 'Failed to unban user.' });
  }
}

// 5. Delete User Permanently (Hard Delete with cascading delete)
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    if (parseInt(id, 10) === adminId) {
      return res.status(400).json({ error: 'Cannot delete your own admin account.' });
    }

    const userRes = await db.query('SELECT id, name, email, role FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const targetUser = userRes.rows[0];
    if (targetUser.role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete an administrator account.' });
    }

    // Perform hard delete. Note: foreign keys with ON DELETE CASCADE handle associated tables.
    // For orders where this user was a buyer or seller, foreign keys cascade or clean up.
    await db.query('DELETE FROM users WHERE id = $1', [id]);

    await logAdminAction(
      adminId,
      'DELETE_USER',
      'USER',
      id,
      `Permanently hard-deleted student account ${targetUser.name} (${targetUser.email}) and all related data.`
    );

    res.json({
      message: `User ${targetUser.name} and all associated campus records have been permanently deleted.`
    });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
}

// 6. Get All Products for Admin
async function getAllProducts(req, res) {
  try {
    const { q, category, status } = req.query;

    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (q && q.trim()) {
      conditions.push(`(p.name ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx} OR u.name ILIKE $${paramIdx})`);
      params.push(`%${q.trim()}%`);
      paramIdx++;
    }

    if (category) {
      conditions.push(`p.category_id = $${paramIdx}`);
      params.push(parseInt(category, 10));
      paramIdx++;
    }

    if (status) {
      conditions.push(`p.status = $${paramIdx}`);
      params.push(status.toUpperCase());
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        p.id,
        p.name,
        p.price,
        p.condition,
        p.location,
        p.status,
        p.created_at,
        c.id AS category_id,
        c.name AS category_name,
        u.id AS seller_id,
        u.name AS seller_name,
        u.email AS seller_email,
        u.is_banned AS seller_is_banned,
        COALESCE(
          (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id ASC LIMIT 1),
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'
        ) AS primary_image
      FROM products p
      JOIN users u ON p.seller_id = u.id
      JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.created_at DESC
    `;

    const result = await db.query(query, params);
    res.json({ products: result.rows });
  } catch (err) {
    console.error('getAllProducts error:', err);
    res.status(500).json({ error: 'Failed to retrieve products for admin.' });
  }
}

// 7. Delist Product
async function delistProduct(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const prodRes = await db.query('SELECT id, name, status FROM products WHERE id = $1', [id]);
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = prodRes.rows[0];

    await db.query("UPDATE products SET status = 'DELISTED', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);

    await logAdminAction(
      adminId,
      'DELIST_PRODUCT',
      'PRODUCT',
      id,
      `Delisted product listing "${product.name}" from public marketplace.`
    );

    res.json({
      message: `Product "${product.name}" has been delisted from public browse.`,
      status: 'DELISTED'
    });
  } catch (err) {
    console.error('delistProduct error:', err);
    res.status(500).json({ error: 'Failed to delist product.' });
  }
}

// 8. Relist Product
async function relistProduct(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const prodRes = await db.query('SELECT id, name, status FROM products WHERE id = $1', [id]);
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = prodRes.rows[0];

    await db.query("UPDATE products SET status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);

    await logAdminAction(
      adminId,
      'RELIST_PRODUCT',
      'PRODUCT',
      id,
      `Relisted product "${product.name}" making it publicly active.`
    );

    res.json({
      message: `Product "${product.name}" is now active on the marketplace.`,
      status: 'ACTIVE'
    });
  } catch (err) {
    console.error('relistProduct error:', err);
    res.status(500).json({ error: 'Failed to relist product.' });
  }
}

// 9. Add Category
async function addCategory(req, res) {
  try {
    const adminId = req.user.id;
    const { name, description, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const trimmedName = name.trim();

    // Check unique
    const existing = await db.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [trimmedName]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'A category with this name already exists.' });
    }

    const insertRes = await db.query(
      `INSERT INTO categories (name, description, icon)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [trimmedName, description ? description.trim() : null, icon || 'tag']
    );

    const newCategory = insertRes.rows[0];

    await logAdminAction(
      adminId,
      'ADD_CATEGORY',
      'CATEGORY',
      newCategory.id,
      `Added new product category: "${newCategory.name}"`
    );

    res.status(201).json({
      message: 'Category created successfully.',
      category: newCategory
    });
  } catch (err) {
    console.error('addCategory error:', err);
    res.status(500).json({ error: 'Failed to create category.' });
  }
}

// 10. Edit Category
async function editCategory(req, res) {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { name, description, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const trimmedName = name.trim();

    // Check duplicate name for different id
    const dupCheck = await db.query(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2',
      [trimmedName, id]
    );

    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Another category with this name already exists.' });
    }

    const updateRes = await db.query(
      `UPDATE categories
       SET name = $1, description = $2, icon = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [trimmedName, description ? description.trim() : null, icon || 'tag', id]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const updatedCat = updateRes.rows[0];

    await logAdminAction(
      adminId,
      'EDIT_CATEGORY',
      'CATEGORY',
      id,
      `Updated category details for "${updatedCat.name}"`
    );

    res.json({
      message: 'Category updated successfully.',
      category: updatedCat
    });
  } catch (err) {
    console.error('editCategory error:', err);
    res.status(500).json({ error: 'Failed to update category.' });
  }
}

// 11. Delete Category (Safe check)
async function deleteCategory(req, res) {
  try {
    const adminId = req.user.id;
    const { id } = req.params;

    const catRes = await db.query('SELECT id, name FROM categories WHERE id = $1', [id]);
    if (catRes.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const category = catRes.rows[0];

    // Check if category has products
    const prodCountRes = await db.query('SELECT COUNT(*) AS count FROM products WHERE category_id = $1', [id]);
    const prodCount = parseInt(prodCountRes.rows[0]?.count || 0, 10);

    if (prodCount > 0) {
      return res.status(400).json({
        error: `Cannot delete category "${category.name}" because it contains ${prodCount} product(s). Please reassign or remove these products first.`
      });
    }

    await db.query('DELETE FROM categories WHERE id = $1', [id]);

    await logAdminAction(
      adminId,
      'DELETE_CATEGORY',
      'CATEGORY',
      id,
      `Deleted empty category "${category.name}"`
    );

    res.json({ message: `Category "${category.name}" deleted successfully.` });
  } catch (err) {
    console.error('deleteCategory error:', err);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
}

// 12. Get All Orders & Transactions
async function getAllOrders(req, res) {
  try {
    const query = `
      SELECT 
        o.id,
        o.order_number,
        o.amount,
        o.platform_fee,
        o.total_amount,
        o.status,
        o.delivery_location,
        o.created_at,
        p.id AS product_id,
        p.name AS product_name,
        buyer.id AS buyer_id,
        buyer.name AS buyer_name,
        buyer.email AS buyer_email,
        seller.id AS seller_id,
        seller.name AS seller_name,
        seller.email AS seller_email,
        pay.razorpay_order_id,
        pay.razorpay_payment_id,
        pay.payment_status,
        pay.payment_method,
        pay.payment_details
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users buyer ON o.buyer_id = buyer.id
      JOIN users seller ON o.seller_id = seller.id
      LEFT JOIN payments pay ON o.id = pay.order_id
      ORDER BY o.created_at DESC
    `;

    const result = await db.query(query);
    res.json({ orders: result.rows });
  } catch (err) {
    console.error('getAllOrders error:', err);
    res.status(500).json({ error: 'Failed to retrieve transactions.' });
  }
}

// 13. Get Admin Logs
async function getAdminLogs(req, res) {
  try {
    const query = `
      SELECT l.id, l.action, l.target_type, l.target_id, l.description, l.created_at,
             u.name AS admin_name, u.email AS admin_email
      FROM admin_activity_logs l
      LEFT JOIN users u ON l.admin_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `;

    const result = await db.query(query);
    res.json({ logs: result.rows });
  } catch (err) {
    console.error('getAdminLogs error:', err);
    res.status(500).json({ error: 'Failed to retrieve admin logs.' });
  }
}

module.exports = {
  getPlatformStats,
  getUsers,
  banUser,
  unbanUser,
  deleteUser,
  getAllProducts,
  delistProduct,
  relistProduct,
  addCategory,
  editCategory,
  deleteCategory,
  getAllOrders,
  getAdminLogs
};
