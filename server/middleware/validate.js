// Strict UoH Email Validation regex
// Requirements:
// - Allowed format: anything@uohyd.ac.in
// - Reject non-UoH email addresses
// - Error message: "Only University of Hyderabad email addresses ending with @uohyd.ac.in are allowed."
const UOH_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@uohyd\.ac\.in$/;

function validateUoHEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return UOH_EMAIL_REGEX.test(email.trim());
}

function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
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

module.exports = {
  UOH_EMAIL_REGEX,
  validateUoHEmail,
  normalizeEmail,
  validateEmailMiddleware
};
