const http = require('http');
const { app, startServer } = require('../server');
const db = require('../config/db');

let serverInstance;
let baseUrl;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, body: json, headers: res.headers });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n========================================');
  console.log(' Starting UoH Marketplace API Test Suite');
  console.log('========================================\n');

  await db.initDB();

  // Start temporary test server
  const testPort = 5055;
  serverInstance = app.listen(testPort);
  baseUrl = `http://localhost:${testPort}`;

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(` PASS: ${message}`);
      passed++;
    } else {
      console.error(` FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.body.status === 'healthy', 'GET /api/health returns healthy');

    // 2. Auth: Reject non-UoH email
    const badReg = await request('POST', '/api/auth/register', {
      name: 'Imposter Student',
      email: 'imposter@gmail.com',
      password: 'password123'
    });
    assert(
      badReg.status === 400 && badReg.body.error.includes('Only University of Hyderabad email addresses'),
      'POST /api/auth/register rejects non-@uohyd.ac.in email address'
    );

    // 3. Auth: Register valid UoH student
    const uniqueEmail = `test.student.${Date.now()}@uohyd.ac.in`;
    const goodReg = await request('POST', '/api/auth/register', {
      name: 'Test Student',
      email: uniqueEmail,
      password: 'StudentPass@123',
      department: 'School of Physics',
      role: 'admin' // Attempt privilege escalation
    });
    assert(
      goodReg.status === 201 && goodReg.body.token && goodReg.body.user.role === 'student',
      'POST /api/auth/register creates account and strictly enforces student role'
    );
    const testStudentToken = goodReg.body.token;

    // 4. Auth: Login with seeded student
    const studentLogin = await request('POST', '/api/auth/login', {
      email: 'vibhishan.kumar@uohyd.ac.in',
      password: 'Student@123'
    });
    assert(
      studentLogin.status === 200 && studentLogin.body.token,
      'POST /api/auth/login succeeds for valid seeded student'
    );
    const vibhishanToken = studentLogin.body.token;
    const vibhishanUser = studentLogin.body.user;

    // 5. Auth: Banned user cannot login
    const bannedLogin = await request('POST', '/api/auth/login', {
      email: 'banned.student@uohyd.ac.in',
      password: 'Student@123'
    });
    assert(
      bannedLogin.status === 403 && bannedLogin.body.error.includes('suspended'),
      'POST /api/auth/login blocks banned user with 403 Forbidden'
    );

    // 6. Products: Browse catalog excludes banned user products and sold items
    const productsRes = await request('GET', '/api/products?limit=50');
    assert(productsRes.status === 200 && Array.isArray(productsRes.body.products), 'GET /api/products returns product array');
    
    // Check that banned user's product is NOT in public catalog
    const hasBannedItem = productsRes.body.products.some(p => p.name.includes('Demo Suspended Item'));
    assert(!hasBannedItem, 'Public catalog correctly filters out items from banned students');

    // 7. RBAC: Student forbidden from Admin endpoint
    const studentAccessAdmin = await request('GET', '/api/admin/stats', null, {
      Authorization: `Bearer ${vibhishanToken}`
    });
    assert(studentAccessAdmin.status === 403, 'Student calling /api/admin/stats receives 403 Forbidden');

    // 8. Admin login and access
    const adminLogin = await request('POST', '/api/auth/login', {
      email: 'admin@uohyd.ac.in',
      password: 'Admin@123'
    });
    assert(adminLogin.status === 200 && adminLogin.body.user.role === 'admin', 'Admin login successful with admin role');
    const adminToken = adminLogin.body.token;

    const adminStats = await request('GET', '/api/admin/stats', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(
      adminStats.status === 200 && adminStats.body.metrics.totalUsers > 0,
      'Admin successfully accesses /api/admin/stats metrics'
    );

    // 9. Product Creation by Student
    const newProductRes = await request('POST', '/api/products', {
      name: 'UoH Physics Lab Manual Sem 2',
      description: 'Original spiral bound practical experiment record with circuit diagrams.',
      price: 150,
      category_id: 1,
      condition: 'Good',
      location: 'School of Physics Gate 2',
      imageUrls: ['https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=600&q=80']
    }, {
      Authorization: `Bearer ${testStudentToken}`
    });
    assert(newProductRes.status === 201 && newProductRes.body.product.id, 'Student can create product listing');
    const createdProductId = newProductRes.body.product.id;

    // 10. Wishlist toggle
    const wishAdd = await request('POST', `/api/wishlist/${createdProductId}`, null, {
      Authorization: `Bearer ${vibhishanToken}`
    });
    assert(wishAdd.status === 201 && wishAdd.body.isWishlisted === true, 'Student can add product to wishlist');

    // 11. Concurrency / Purchase Flow
    // Buyer (Vibhishan) initiates checkout for created product
    const orderInit = await request('POST', '/api/payments/create-order', {
      productId: createdProductId
    }, {
      Authorization: `Bearer ${vibhishanToken}`
    });
    assert(orderInit.status === 200 && orderInit.body.orderId, 'POST /api/payments/create-order initiates payment');

    // Verify payment and complete purchase
    const verifyRes = await request('POST', '/api/payments/verify', {
      productId: createdProductId,
      deliveryLocation: 'SCIS Library Steps',
      razorpayOrderId: orderInit.body.orderId,
      razorpayPaymentId: 'pay_test_' + Date.now(),
      razorpaySignature: 'sandbox_sig_verified_' + Date.now()
    }, {
      Authorization: `Bearer ${vibhishanToken}`
    });
    assert(verifyRes.status === 201 && verifyRes.body.order.status === 'COMPLETED', 'Payment verified and order created');
    const completedOrderId = verifyRes.body.order.id;

    // Double-purchase attempt must fail because product is now SOLD
    const doublePurchase = await request('POST', '/api/payments/verify', {
      productId: createdProductId,
      deliveryLocation: 'Campus Gate',
      razorpayOrderId: 'order_test_dup',
      razorpayPaymentId: 'pay_test_dup',
      razorpaySignature: 'sandbox_sig_dup'
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(doublePurchase.status === 400, 'Second purchase attempt for sold item rejected (Atomic double-purchase protection)');

    // 12. Review System: Verified buyer submits review
    const reviewRes = await request('POST', '/api/reviews', {
      orderId: completedOrderId,
      rating: 5,
      reviewText: 'Great physics manual! Met near the library on time.'
    }, {
      Authorization: `Bearer ${vibhishanToken}`
    });
    assert(reviewRes.status === 201 && reviewRes.body.review.rating === 5, 'Verified buyer can review seller');

    // Duplicate review attempt must fail
    const dupReview = await request('POST', '/api/reviews', {
      orderId: completedOrderId,
      rating: 4,
      reviewText: 'Trying to review again'
    }, {
      Authorization: `Bearer ${vibhishanToken}`
    });
    assert(dupReview.status === 400, 'Duplicate review for same purchase transaction is rejected');

    // 13. Admin: Ban and Unban student
    const banAction = await request('PATCH', `/api/admin/users/${goodReg.body.user.id}/ban`, null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(banAction.status === 200 && banAction.body.is_banned === true, 'Admin can ban a student account');

    const unbanAction = await request('PATCH', `/api/admin/users/${goodReg.body.user.id}/unban`, null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(unbanAction.status === 200 && unbanAction.body.is_banned === false, 'Admin can unban a student account');

    // 14. Admin: Delist and Relist product
    const delistAction = await request('PATCH', `/api/admin/products/${productIdsForCheck = 1}/delist`, null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(delistAction.status === 200 && delistAction.body.status === 'DELISTED', 'Admin can delist product');

    const relistAction = await request('PATCH', `/api/admin/products/1/relist`, null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(relistAction.status === 200 && relistAction.body.status === 'ACTIVE', 'Admin can relist product');

    // 15. Admin Activity Logs exist
    const adminLogs = await request('GET', '/api/admin/logs', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(adminLogs.status === 200 && adminLogs.body.logs.length > 0, 'Admin audit activity logs recorded and retrieved');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    serverInstance.close();
    console.log('\n========================================');
    console.log(` Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('========================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
