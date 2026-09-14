const db = require('../config/db');
const { uploadImage } = require('../config/cloudinary');
const { broadcastEvent } = require('../services/socketService');

// Browse, search, filter, and paginate active products
async function getProducts(req, res) {
  try {
    const {
      q,
      category,
      condition,
      minPrice,
      maxPrice,
      location,
      sort = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    // Base conditions: must be ACTIVE and seller must NOT be banned
    const conditions = ["p.status = 'ACTIVE'", "u.is_banned = FALSE"];
    const params = [];
    let paramIndex = 1;

    // Search query
    if (q && q.trim()) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.location ILIKE $${paramIndex})`);
      params.push(`%${q.trim()}%`);
      paramIndex++;
    }

    // Category filter
    if (category) {
      if (!isNaN(category)) {
        conditions.push(`p.category_id = $${paramIndex}`);
        params.push(parseInt(category, 10));
        paramIndex++;
      } else {
        conditions.push(`c.name ILIKE $${paramIndex}`);
        params.push(category.trim());
        paramIndex++;
      }
    }

    // Condition filter
    if (condition) {
      conditions.push(`p.condition = $${paramIndex}`);
      params.push(condition);
      paramIndex++;
    }

    // Price range
    if (minPrice && !isNaN(minPrice)) {
      conditions.push(`p.price >= $${paramIndex}`);
      params.push(parseFloat(minPrice));
      paramIndex++;
    }

    if (maxPrice && !isNaN(maxPrice)) {
      conditions.push(`p.price <= $${paramIndex}`);
      params.push(parseFloat(maxPrice));
      paramIndex++;
    }

    // Location
    if (location && location.trim()) {
      conditions.push(`p.location ILIKE $${paramIndex}`);
      params.push(`%${location.trim()}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sorting
    let orderBy = 'ORDER BY p.created_at DESC';
    if (sort === 'price_asc') {
      orderBy = 'ORDER BY p.price ASC';
    } else if (sort === 'price_desc') {
      orderBy = 'ORDER BY p.price DESC';
    } else if (sort === 'oldest') {
      orderBy = 'ORDER BY p.created_at ASC';
    }

    // Total count query
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) AS total
      FROM products p
      JOIN users u ON p.seller_id = u.id
      JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;

    const countRes = await db.query(countQuery, params);
    const totalCount = parseInt(countRes.rows[0]?.total || 0, 10);
    const totalPages = Math.ceil(totalCount / limitNum);

    // Products query with primary image and seller info
    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
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
        u.department AS seller_department,
        u.profile_image AS seller_image,
        COALESCE(
          (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id ASC LIMIT 1),
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'
        ) AS primary_image,
        (SELECT COUNT(*) FROM wishlist WHERE product_id = p.id) AS wishlist_count
      FROM products p
      JOIN users u ON p.seller_id = u.id
      JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const queryParams = [...params, limitNum, offset];
    const productsRes = await db.query(query, queryParams);

    // If user is authenticated, check wishlist status for each product
    let userWishlistSet = new Set();
    if (req.user) {
      const wishRes = await db.query('SELECT product_id FROM wishlist WHERE user_id = $1', [req.user.id]);
      userWishlistSet = new Set(wishRes.rows.map(r => r.product_id));
    }

    const items = productsRes.rows.map(p => ({
      ...p,
      isWishlisted: userWishlistSet.has(p.id)
    }));

    res.json({
      products: items,
      pagination: {
        totalCount,
        totalPages,
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (err) {
    console.error('getProducts error:', err);
    res.status(500).json({ error: 'Failed to fetch marketplace products.' });
  }
}

// Get single product details
async function getProductById(req, res) {
  try {
    const { id } = req.params;

    const productRes = await db.query(
      `SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.condition,
        p.location,
        p.status,
        p.created_at,
        p.updated_at,
        c.id AS category_id,
        c.name AS category_name,
        u.id AS seller_id,
        u.name AS seller_name,
        u.email AS seller_email,
        u.department AS seller_department,
        u.phone AS seller_phone,
        u.profile_image AS seller_image,
        u.is_banned AS seller_is_banned,
        u.created_at AS seller_joined_date,
        COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE seller_id = u.id), 0) AS seller_avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE seller_id = u.id) AS seller_total_reviews
       FROM products p
       JOIN users u ON p.seller_id = u.id
       JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );

    if (productRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = productRes.rows[0];

    // If seller is banned, do not display unless requester is an admin
    if (product.seller_is_banned && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({ error: 'This product listing is unavailable.' });
    }

    // Get all images
    const imagesRes = await db.query(
      'SELECT id, image_url, is_primary FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC, id ASC',
      [id]
    );

    // Get seller reviews
    const reviewsRes = await db.query(
      `SELECT r.id, r.rating, r.review_text, r.created_at,
              b.id AS buyer_id, b.name AS buyer_name, b.profile_image AS buyer_image
       FROM reviews r
       JOIN users b ON r.buyer_id = b.id
       WHERE r.seller_id = $1
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [product.seller_id]
    );

    // Check if wishlisted by current user
    let isWishlisted = false;
    if (req.user) {
      const wishRes = await db.query(
        'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
        [req.user.id, id]
      );
      isWishlisted = wishRes.rows.length > 0;
    }

    res.json({
      product: {
        ...product,
        images: imagesRes.rows,
        sellerReviews: reviewsRes.rows,
        isWishlisted,
        isOwner: req.user ? req.user.id === product.seller_id : false
      }
    });
  } catch (err) {
    console.error('getProductById error:', err);
    res.status(500).json({ error: 'Failed to retrieve product details.' });
  }
}

// Create new product listing
async function createProduct(req, res) {
  try {
    const sellerId = req.user.id;
    const { name, description, price, category_id, condition, location, imageUrls } = req.body;

    if (!name || !description || !price || !category_id || !condition || !location) {
      return res.status(400).json({ error: 'All product fields are required.' });
    }

    if (parseFloat(price) < 0) {
      return res.status(400).json({ error: 'Price must be greater than or equal to 0.' });
    }

    // Insert product
    const productRes = await db.query(
      `INSERT INTO products (seller_id, category_id, name, description, price, condition, location, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
       RETURNING *`,
      [sellerId, category_id, name.trim(), description.trim(), parseFloat(price), condition, location.trim()]
    );

    const product = productRes.rows[0];

    // Collect images: from uploaded files OR imageUrls array passed in body
    const uploadedImages = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadImage(file, 'uoh-marketplace/products');
        uploadedImages.push(url);
      }
    }

    // Also support string/array of URLs (for quick seed or external image support)
    if (imageUrls) {
      const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
      for (const u of urls) {
        if (typeof u === 'string' && u.trim().startsWith('http')) {
          uploadedImages.push(u.trim());
        }
      }
    }

    // Fallback default image if none provided
    if (uploadedImages.length === 0) {
      uploadedImages.push('https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80');
    }

    // Insert product images
    for (let i = 0; i < uploadedImages.length; i++) {
      await db.query(
        `INSERT INTO product_images (product_id, image_url, is_primary)
         VALUES ($1, $2, $3)`,
        [product.id, uploadedImages[i], i === 0]
      );
    }

    broadcastEvent('product_created', { productId: product.id, name: product.name });

    res.status(201).json({
      message: 'Product listed successfully on UoH Marketplace!',
      product: {
        ...product,
        images: uploadedImages
      }
    });
  } catch (err) {
    console.error('createProduct error:', err);
    res.status(500).json({ error: 'Failed to create product listing.' });
  }
}

// Update existing product listing
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, description, price, category_id, condition, location, status } = req.body;

    // Check ownership
    const checkRes = await db.query('SELECT seller_id, status FROM products WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (checkRes.rows[0].seller_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to modify this listing.' });
    }

    // Update product fields
    const updateRes = await db.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           category_id = COALESCE($4, category_id),
           condition = COALESCE($5, condition),
           location = COALESCE($6, location),
           status = COALESCE($7, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        name ? name.trim() : null,
        description ? description.trim() : null,
        price ? parseFloat(price) : null,
        category_id ? parseInt(category_id, 10) : null,
        condition || null,
        location ? location.trim() : null,
        status || null,
        id
      ]
    );

    // Handle new uploaded images if provided
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadImage(file, 'uoh-marketplace/products');
        await db.query(
          'INSERT INTO product_images (product_id, image_url, is_primary) VALUES ($1, $2, FALSE)',
          [id, url]
        );
      }
    }

    res.json({
      message: 'Listing updated successfully.',
      product: updateRes.rows[0]
    });
  } catch (err) {
    console.error('updateProduct error:', err);
    res.status(500).json({ error: 'Failed to update product.' });
  }
}

// Delete product
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const checkRes = await db.query('SELECT seller_id FROM products WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (checkRes.rows[0].seller_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this listing.' });
    }

    await db.query('DELETE FROM products WHERE id = $1', [id]);

    res.json({ message: 'Product listing deleted successfully.' });
  } catch (err) {
    console.error('deleteProduct error:', err);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
}

// Mark product as sold
async function markAsSold(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const checkRes = await db.query('SELECT seller_id, status FROM products WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (checkRes.rows[0].seller_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to mark this product as sold.' });
    }

    const updatedRes = await db.query(
      "UPDATE products SET status = 'SOLD', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [id]
    );

    res.json({
      message: 'Product marked as sold.',
      product: updatedRes.rows[0]
    });
  } catch (err) {
    console.error('markAsSold error:', err);
    res.status(500).json({ error: 'Failed to update product status.' });
  }
}

// Get user's own listings (active, sold, delisted)
async function getMyListings(req, res) {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let queryStr = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.condition,
        p.location,
        p.status,
        p.created_at,
        c.name AS category_name,
        COALESCE(
          (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id ASC LIMIT 1),
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'
        ) AS primary_image,
        (SELECT COUNT(*) FROM wishlist WHERE product_id = p.id) AS wishlist_count
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.seller_id = $1
    `;

    const params = [userId];
    if (status) {
      queryStr += ' AND p.status = $2';
      params.push(status.toUpperCase());
    }

    queryStr += ' ORDER BY p.created_at DESC';

    const result = await db.query(queryStr, params);
    res.json({ products: result.rows });
  } catch (err) {
    console.error('getMyListings error:', err);
    res.status(500).json({ error: 'Failed to fetch user listings.' });
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  markAsSold,
  getMyListings
};
