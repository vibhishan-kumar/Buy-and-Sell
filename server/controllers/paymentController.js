const db = require('../config/db');
const { createRazorpayOrder, verifyPaymentSignature, keyId } = require('../config/razorpay');
const { createNotification } = require('../services/notificationService');
const { broadcastEvent, emitToUser } = require('../services/socketService');

// Create Razorpay Order
async function createOrder(req, res) {
  try {
    const buyerId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required.' });
    }

    // Check product status and ownership
    const prodRes = await db.query(
      `SELECT p.id, p.name, p.price, p.status, p.seller_id, u.is_banned AS seller_banned
       FROM products p
       JOIN users u ON p.seller_id = u.id
       WHERE p.id = $1`,
      [productId]
    );

    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = prodRes.rows[0];

    if (product.seller_banned) {
      return res.status(400).json({ error: 'This product cannot be purchased as the seller account is suspended.' });
    }

    if (product.status !== 'ACTIVE') {
      return res.status(400).json({ error: `Product is not available for purchase (Current status: ${product.status}).` });
    }

    if (product.seller_id === buyerId) {
      return res.status(400).json({ error: 'You cannot purchase your own product.' });
    }

    const price = parseFloat(product.price);
    const platformFee = 0.00; // Campus friendly zero fee
    const totalAmount = price + platformFee;
    const amountInPaise = Math.round(totalAmount * 100);

    const receipt = `rcpt_${product.id}_${Date.now()}`.substring(0, 40);
    const razorpayOrder = await createRazorpayOrder(amountInPaise, 'INR', receipt);

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: keyId,
      product: {
        id: product.id,
        name: product.name,
        price,
        platformFee,
        totalAmount
      }
    });
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(500).json({ error: 'Failed to initiate checkout order.' });
  }
}

// Verify payment and complete purchase transaction
async function verifyPayment(req, res) {
  const client = await db.getTransactionClient();
  try {
    const buyerId = req.user.id;
    const {
      productId,
      deliveryLocation = 'UoH Campus Delivery Point',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = req.body;

    if (!productId || !razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({ error: 'Missing required payment verification details.' });
    }

    // Verify signature
    const isValidSignature = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValidSignature) {
      return res.status(400).json({ error: 'Payment signature verification failed. Untrusted transaction.' });
    }

    // Begin atomic transaction to prevent concurrent double-purchasing
    await client.query('BEGIN');

    // Lock product row
    const prodRes = await client.query(
      'SELECT id, name, price, status, seller_id FROM products WHERE id = $1 FOR UPDATE',
      [productId]
    );

    if (prodRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = prodRes.rows[0];

    if (product.status !== 'ACTIVE') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Sorry! This product has already been sold or is no longer available.' });
    }

    if (product.seller_id === buyerId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You cannot purchase your own listing.' });
    }

    // 1. Mark product as SOLD
    await client.query(
      "UPDATE products SET status = 'SOLD', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [productId]
    );

    // 2. Create Order
    const orderNumber = `UOH-ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const price = parseFloat(product.price);
    const platformFee = 0.00;
    const totalAmount = price + platformFee;

    const orderRes = await client.query(
      `INSERT INTO orders (order_number, product_id, buyer_id, seller_id, amount, platform_fee, total_amount, status, delivery_location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'COMPLETED', $8)
       RETURNING *`,
      [orderNumber, product.id, buyerId, product.seller_id, price, platformFee, totalAmount, deliveryLocation]
    );

    const order = orderRes.rows[0];

    // 3. Record Payment
    await client.query(
      `INSERT INTO payments (order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, currency, payment_status)
       VALUES ($1, $2, $3, $4, $5, 'INR', 'SUCCESS')`,
      [order.id, razorpayOrderId, razorpayPaymentId, razorpaySignature, totalAmount]
    );

    // Commit transaction
    await client.query('COMMIT');

    // Notify seller
    await createNotification({
      userId: product.seller_id,
      type: 'PRODUCT_SOLD',
      title: 'Item Sold!',
      message: `Your listing "${product.name}" was purchased by ${req.user.name} for ₹${price}.`,
      link: `/orders?id=${order.id}`
    });

    // Notify buyer
    await createNotification({
      userId: buyerId,
      type: 'PAYMENT_SUCCESS',
      title: 'Order Confirmed!',
      message: `Payment of ₹${totalAmount} successful for "${product.name}". Order #${orderNumber}.`,
      link: `/orders?id=${order.id}`
    });

    // Broadcast live product status change
    broadcastEvent('product_sold', { productId: product.id, productName: product.name });

    res.status(201).json({
      message: 'Payment verified and order placed successfully!',
      order: {
        ...order,
        product_name: product.name,
        payment_id: razorpayPaymentId
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('verifyPayment error:', err);
    res.status(500).json({ error: 'Failed to process payment verification.' });
  } finally {
    client.release();
  }
}

// Get user orders (both as buyer and seller)
async function getUserOrders(req, res) {
  try {
    const userId = req.user.id;
    const { role = 'buyer' } = req.query; // 'buyer' or 'seller'

    let whereClause = 'o.buyer_id = $1';
    if (role === 'seller') {
      whereClause = 'o.seller_id = $1';
    }

    const query = `
      SELECT 
        o.id,
        o.order_number,
        o.product_id,
        o.amount,
        o.platform_fee,
        o.total_amount,
        o.status,
        o.delivery_location,
        o.created_at,
        p.name AS product_name,
        p.condition AS product_condition,
        COALESCE(
          (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id ASC LIMIT 1),
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'
        ) AS product_image,
        buyer.id AS buyer_id,
        buyer.name AS buyer_name,
        buyer.email AS buyer_email,
        seller.id AS seller_id,
        seller.name AS seller_name,
        seller.email AS seller_email,
        pay.razorpay_payment_id,
        r.id AS review_id,
        r.rating AS review_rating,
        r.review_text
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users buyer ON o.buyer_id = buyer.id
      JOIN users seller ON o.seller_id = seller.id
      LEFT JOIN payments pay ON o.id = pay.order_id
      LEFT JOIN reviews r ON o.id = r.order_id
      WHERE ${whereClause}
      ORDER BY o.created_at DESC
    `;

    const result = await db.query(query, [userId]);
    res.json({ orders: result.rows });
  } catch (err) {
    console.error('getUserOrders error:', err);
    res.status(500).json({ error: 'Failed to fetch order history.' });
  }
}

// Get single order details
async function getOrderById(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        o.id,
        o.order_number,
        o.product_id,
        o.amount,
        o.platform_fee,
        o.total_amount,
        o.status,
        o.delivery_location,
        o.created_at,
        p.name AS product_name,
        p.description AS product_description,
        p.condition AS product_condition,
        p.location AS product_location,
        COALESCE(
          (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id ASC LIMIT 1),
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'
        ) AS product_image,
        buyer.id AS buyer_id,
        buyer.name AS buyer_name,
        buyer.email AS buyer_email,
        buyer.phone AS buyer_phone,
        seller.id AS seller_id,
        seller.name AS seller_name,
        seller.email AS seller_email,
        seller.phone AS seller_phone,
        pay.razorpay_payment_id,
        pay.payment_status,
        r.id AS review_id,
        r.rating AS review_rating,
        r.review_text
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN users buyer ON o.buyer_id = buyer.id
       JOIN users seller ON o.seller_id = seller.id
       LEFT JOIN payments pay ON o.id = pay.order_id
       LEFT JOIN reviews r ON o.id = r.order_id
       WHERE o.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = result.rows[0];

    // Must be buyer, seller, or admin
    if (order.buyer_id !== userId && order.seller_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to view this order.' });
    }

    res.json({ order });
  } catch (err) {
    console.error('getOrderById error:', err);
    res.status(500).json({ error: 'Failed to retrieve order details.' });
  }
}

module.exports = {
  createOrder,
  verifyPayment,
  getUserOrders,
  getOrderById
};
