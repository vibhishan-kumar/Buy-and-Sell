/**
 * Input Validation Middleware: Regex + Backend Validation
 * University of Hyderabad Campus Marketplace
 */

// 1. Strict UoH Email Validation regex (@uohyd.ac.in only)
const UOH_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@uohyd\.ac\.in$/;

// 2. Indian Mobile Phone Number regex (optional +91, 10 digits starting with 6-9)
const PHONE_REGEX = /^(\+91[\-\s]?)?[6789]\d{9}$/;

// 3. Price validation regex (positive integer or up to 2 decimal places)
const PRICE_REGEX = /^\d+(\.\d{1,2})?$/;

// 4. Allowed Product Conditions
const VALID_CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];

function validateUoHEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return UOH_EMAIL_REGEX.test(email.trim());
}

function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

function validatePhone(phone) {
  if (!phone) return true; // Phone is optional in profile
  return PHONE_REGEX.test(phone.trim());
}

function validatePrice(price) {
  if (price === undefined || price === null || price === '') return false;
  const num = parseFloat(price);
  return !isNaN(num) && num >= 0 && PRICE_REGEX.test(price.toString().trim());
}

// Express middleware for registration & login email validation
function validateEmailMiddleware(req, res, next) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalized = normalizeEmail(email);
  if (!validateUoHEmail(normalized)) {
    return res.status(400).json({
      error: 'Only University of Hyderabad email addresses ending with @uohyd.ac.in are allowed.'
    });
  }

  req.body.email = normalized;
  next();
}

// Express middleware for product listing creation/update validation
function validateProductMiddleware(req, res, next) {
  const { name, description, price, condition, location, category_id } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 3) {
    return res.status(400).json({ error: 'Product title must be at least 3 characters long.' });
  }

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    return res.status(400).json({ error: 'Product description must be at least 10 characters long.' });
  }

  if (!validatePrice(price)) {
    return res.status(400).json({ error: 'Price must be a valid positive number.' });
  }

  if (condition && !VALID_CONDITIONS.includes(condition)) {
    return res.status(400).json({
      error: `Condition must be one of: ${VALID_CONDITIONS.join(', ')}`
    });
  }

  if (!location || typeof location !== 'string' || location.trim().length < 3) {
    return res.status(400).json({ error: 'Valid campus handover location is required.' });
  }

  next();
}

module.exports = {
  UOH_EMAIL_REGEX,
  PHONE_REGEX,
  PRICE_REGEX,
  VALID_CONDITIONS,
  validateUoHEmail,
  normalizeEmail,
  validatePhone,
  validatePrice,
  validateEmailMiddleware,
  validateProductMiddleware
};
