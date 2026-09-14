const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');
const { validateUoHEmail, normalizeEmail } = require('../middleware/validate');
const { uploadImage } = require('../config/cloudinary');

// Register a new UoH Student
async function register(req, res) {
  try {
    const { name, email, password, department, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const normalizedEmail = normalizeEmail(email);

    // Strict UoH Email Validation
    if (!validateUoHEmail(normalizedEmail)) {
      return res.status(400).json({
        error: 'Only University of Hyderabad email addresses ending with @uohyd.ac.in are allowed.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check existing
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this UoH email already exists.' });
    }

    // Upload profile image if provided
    let profileImageUrl = null;
    if (req.file) {
      profileImageUrl = await uploadImage(req.file, 'uoh-marketplace/profiles');
    }

    // Role MUST ALWAYS be 'student' on public registration!
    const role = 'student';
    const hashedPassword = await bcrypt.hash(password, 10);

    const insertRes = await db.query(
      `INSERT INTO users (name, email, password, department, phone, profile_image, role, is_banned)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
       RETURNING id, name, email, department, phone, profile_image, role, is_banned, created_at`,
      [name.trim(), normalizedEmail, hashedPassword, department || null, phone || null, profileImageUrl, role]
    );

    const user = insertRes.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful. Welcome to UoH Marketplace!',
      token,
      user
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create student account.' });
  }
}

// Login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = normalizeEmail(email);

    // Strict UoH Email Validation
    if (!validateUoHEmail(normalizedEmail)) {
      return res.status(400).json({
        error: 'Only University of Hyderabad email addresses ending with @uohyd.ac.in are allowed.'
      });
    }

    const userRes = await db.query(
      `SELECT id, name, email, password, department, phone, profile_image, role, is_banned, created_at
       FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid UoH credentials.' });
    }

    const user = userRes.rows[0];

    // Check if banned
    if (user.is_banned) {
      return res.status(403).json({
        error: 'Your student account has been suspended by campus administration. Please contact administration.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid UoH credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    delete user.password;

    res.json({
      message: 'Login successful.',
      token,
      user
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
}

// Current User Profile
async function getMe(req, res) {
  try {
    const userId = req.user.id;

    // Get basic stats
    const statsRes = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM products WHERE seller_id = $1) AS total_listings,
        (SELECT COUNT(*) FROM products WHERE seller_id = $1 AND status = 'ACTIVE') AS active_listings,
        (SELECT COUNT(*) FROM products WHERE seller_id = $1 AND status = 'SOLD') AS sold_listings,
        (SELECT COUNT(*) FROM orders WHERE buyer_id = $1 AND status = 'COMPLETED') AS purchases_count,
        (SELECT COUNT(*) FROM wishlist WHERE user_id = $1) AS wishlist_count,
        (SELECT COALESCE(ROUND(AVG(rating), 1), 0) FROM reviews WHERE seller_id = $1) AS avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE seller_id = $1) AS total_reviews
       `,
      [userId]
    );

    const stats = statsRes.rows[0];

    res.json({
      user: req.user,
      stats: {
        totalListings: Number(stats.total_listings),
        activeListings: Number(stats.active_listings),
        soldListings: Number(stats.sold_listings),
        purchasesCount: Number(stats.purchases_count),
        wishlistCount: Number(stats.wishlist_count),
        avgRating: Number(stats.avg_rating),
        totalReviews: Number(stats.total_reviews)
      }
    });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
}

// Update Profile
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name, department, phone } = req.body;

    let profileImageUrl = req.user.profile_image;
    if (req.file) {
      profileImageUrl = await uploadImage(req.file, 'uoh-marketplace/profiles');
    }

    const updateRes = await db.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           department = COALESCE($2, department),
           phone = COALESCE($3, phone),
           profile_image = COALESCE($4, profile_image),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, name, email, department, phone, profile_image, role, is_banned, updated_at`,
      [name ? name.trim() : null, department || null, phone || null, profileImageUrl, userId]
    );

    res.json({
      message: 'Profile updated successfully.',
      user: updateRes.rows[0]
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
}

// Forgot Password
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'UoH email is required.' });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!validateUoHEmail(normalizedEmail)) {
      return res.status(400).json({
        error: 'Only University of Hyderabad email addresses ending with @uohyd.ac.in are allowed.'
      });
    }

    const userRes = await db.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (userRes.rows.length === 0) {
      // Don't leak whether user exists
      return res.json({
        message: 'If an account exists with this UoH email, a password reset link has been prepared.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
      [resetToken, expires, normalizedEmail]
    );

    res.json({
      message: 'Password reset token generated.',
      resetToken, // Provided for instant campus testing
      expiresIn: '1 hour'
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
}

// Reset Password
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const userRes = await db.query(
      `SELECT id FROM users 
       WHERE reset_token = $1 AND reset_token_expires > CURRENT_TIMESTAMP`,
      [token]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query(
      `UPDATE users 
       SET password = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [hashedPassword, userRes.rows[0].id]
    );

    res.json({ message: 'Password has been reset successfully. You can now login.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
}

// Change Password
async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const userRes = await db.query('SELECT password FROM users WHERE id = $1', [userId]);
    const isMatch = await bcrypt.compare(currentPassword, userRes.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to update password.' });
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  changePassword
};
