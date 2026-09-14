# 🎓 UoH Marketplace

> **Production-Ready Full-Stack Peer-to-Peer Campus Marketplace for the University of Hyderabad (UoH)**  
> Exclusively for verified students and scholars with `@uohyd.ac.in` credentials.

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Sandbox-0C2340?logo=razorpay&logoColor=white)](https://razorpay.com/)

---

## 📖 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Technology Stack](#-technology-stack)
4. [System Architecture](#-system-architecture)
5. [Database Schema & ER Relationships](#-database-schema--er-relationships)
6. [Folder Structure](#-folder-structure)
7. [Installation & Setup](#-installation--setup)
8. [Running the Application](#-running-the-application)
9. [Pre-Seeded Sample Accounts](#-pre-seeded-sample-accounts)
10. [REST API Documentation](#-rest-api-documentation)
11. [Real-Time Socket.IO Architecture](#-real-time-socketio-architecture)
12. [Razorpay Sandbox Payment Flow & Concurrency Protection](#-razorpay-sandbox-payment-flow--concurrency-protection)
13. [Administrative Governance: Ban vs Delist vs Delete](#-administrative-governance-ban-vs-delist-vs-delete)
14. [Automated Test Suite](#-automated-test-suite)

---

## 🏛️ Project Overview

The **UoH Marketplace** is a secure, authenticated web application designed specifically for the student and scholar community at the **University of Hyderabad (UoH)**. Students can buy, sell, exchange, chat, and review second-hand academic items (e.g., CLRS algorithms manuals, chemistry lab coats, scientific calculators, campus cycles, dorm table fans, study desks) with peer students.

### Security Guarantees
- **Strict UoH Email Authorization**: Only emails matching `^[A-Za-z0-9._%+-]+@uohyd\.ac\.in$` can register or log in. Non-UoH domains (`@gmail.com`, `@outlook.com`, etc.) are rejected on both frontend and backend.
- **Role-Based Access Control (RBAC)**: Public registration strictly grants the `student` role. Admin accounts cannot be self-assigned and are managed via secure environment/seeding.
- **Double-Purchase Protection**: Atomically locks product rows during payment verification using PostgreSQL transactions (`FOR UPDATE`) to prevent concurrent double-purchasing.

---

## ✨ Key Features

### 👨‍🎓 Student Capabilities
- **Authentication**: JWT authentication, bcrypt password hashing, reset password with tokens, profile management with department/phone/photo.
- **Selling / Product Listings**: Post listings with up to 5 photos, price, condition (`New`, `Like New`, `Good`, `Fair`), category, and campus hostel/spot (MH-J, LH-B, Library, Shopping Complex, etc.). Mark items as `SOLD`, edit, or delete.
- **Browse, Search & Filter**: Instant keyword search, category navigation, condition filter, price range bounds, sorting (newest, price asc/desc), and pagination. Automatically filters out suspended accounts and sold items.
- **Real-Time Messaging**: Built-in Socket.IO chat between buyer and seller. Typing indicators, read receipts, unread badges, and product context shortcuts. Users cannot message themselves.
- **Payment Gateway (Buy Now Flow)**: Sandbox Razorpay checkout with order summary, fee breakdown (zero platform fee for students), campus delivery spot picker, and cryptographic signature verification.
- **Verified Reviews & Ratings**: 1–5 star rating and feedback comment. Strictly verified buyers who completed a transaction can submit a review. Prevents duplicate reviews for the same order.
- **Wishlist**: Toggle products in/out of wishlist with live heart indicators and availability tracking.
- **Live Notifications**: Real-time notifications for incoming chat messages, item sales, payment confirmations, and reviews.
- **Student Dashboard**: Quick statistics on active listings, sold goods, purchases, average seller rating, and recent messages.

### 🛡️ Campus Administrative Capabilities
- **Platform Analytics**: Real-time counts of active/suspended students, active/delisted/sold products, completed orders, and trading volume.
- **Student Moderation**:
  - **Ban Student**: Suspends account, keeps data intact, blocks login, and hides their products from public search.
  - **Unban Student**: Restores account access and marketplace visibility.
  - **Permanent Delete User**: Executes cascading hard deletion wiping all user-associated records.
- **Product Governance**:
  - **Delist Product**: Hides flagged item from public browse while preserving record.
  - **Relist Product**: Restores delisted product back to active catalog.
- **Category Management**: Create, edit, and safely delete categories (prevents deleting categories that contain existing products).
- **Transaction Logs**: Audit all transactions with order numbers, amounts, buyer, seller, and Razorpay payment IDs.
- **Activity Logs**: Tamper-evident permanent log (`admin_activity_logs`) of every administrative action.

---

## 💻 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 6, React Router DOM 7, Lucide Icons, Modern Responsive CSS (No Bootstrap) |
| **Backend** | Node.js (v24), Express 4, RESTful APIs |
| **Database** | PostgreSQL with dual-mode support (`pg` connection pool + embedded `@electric-sql/pglite` 16 engine for instant zero-setup execution) |
| **Real-Time** | Socket.IO 4 (WebSockets with JWT handshake authentication) |
| **Payments** | Razorpay SDK (Sandbox / Test Mode) with HMAC-SHA256 signature verification |
| **Media / Storage** | Cloudinary integration with local disk storage fallback (`/uploads`) |
| **Security** | JWT, bcryptjs, Parameterized SQL queries, Strict Regex validation |

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend (React 19 + Vite)"]
        UI["Modern Responsive UI<br/>(No Bootstrap)"]
        SocketClient["Socket.IO Client"]
        AuthCtx["Auth & Toast Contexts"]
    end

    subgraph Server["Backend (Node.js + Express)"]
        Router["Express REST API Router"]
        AuthMid["Auth Middleware & UoH Regex Validator"]
        SocketServer["Socket.IO Event Hub"]
        PayService["Razorpay Payment Service"]
    end

    subgraph Database["PostgreSQL 16 Engine"]
        PG["Normalized DB Tables & Foreign Keys<br/>(Users, Products, Orders, Reviews, Logs)"]
    end

    Client <-->|REST API / JWT| Router
    SocketClient <-->|WebSockets (Chat & Notifs)| SocketServer
    Router --> AuthMid
    AuthMid --> PG
    PayService -->|Atomic Transaction FOR UPDATE| PG
```

---

## 🗄️ Database Schema & ER Relationships

The database utilizes standard PostgreSQL DDL with strict integrity constraints (`server/scripts/schema.sql`):

```mermaid
erDiagram
    users ||--o{ products : "sells"
    users ||--o{ orders : "buys/sells"
    users ||--o{ wishlist : "saves"
    users ||--o{ conversations : "participates"
    users ||--o{ messages : "sends"
    users ||--o{ reviews : "rates"
    users ||--o{ notifications : "receives"
    users ||--o{ admin_activity_logs : "admin actions"

    categories ||--o{ products : "contains"
    products ||--o{ product_images : "has photos"
    products ||--o{ wishlist : "saved in"
    products ||--o{ orders : "purchased in"
    products ||--o{ conversations : "inquired about"

    orders ||--|| payments : "has transaction"
    orders ||--o| reviews : "reviewed in"
    conversations ||--o{ messages : "contains"
```

### Key Tables
1. `users`: `id`, `name`, `email` (UNIQUE), `password` (bcrypt), `department`, `phone`, `profile_image`, `role` (`student` | `admin`), `is_banned`, `created_at`.
2. `categories`: `id`, `name` (UNIQUE), `description`, `icon`, `created_at`.
3. `products`: `id`, `seller_id`, `category_id`, `name`, `description`, `price`, `condition`, `location`, `status` (`ACTIVE`, `SOLD`, `DELISTED`).
4. `product_images`: `id`, `product_id`, `image_url`, `is_primary`.
5. `wishlist`: `id`, `user_id`, `product_id`, UNIQUE(`user_id`, `product_id`).
6. `conversations`: `id`, `product_id`, `buyer_id`, `seller_id`, UNIQUE(`product_id`, `buyer_id`, `seller_id`).
7. `messages`: `id`, `conversation_id`, `sender_id`, `message_text`, `is_read`, `created_at`.
8. `orders`: `id`, `order_number` (UNIQUE), `product_id`, `buyer_id`, `seller_id`, `amount`, `platform_fee`, `total_amount`, `status`, `delivery_location`.
9. `payments`: `id`, `order_id`, `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, `amount`, `currency`, `payment_status`.
10. `reviews`: `id`, `order_id` (UNIQUE), `seller_id`, `buyer_id`, `rating` (1-5), `review_text`.
11. `notifications`: `id`, `user_id`, `type`, `title`, `message`, `link`, `is_read`.
12. `admin_activity_logs`: `id`, `admin_id`, `action`, `target_type`, `target_id`, `description`, `created_at`.

---

## 📁 Folder Structure

```text
uoh-marketplace/
├── client/                     # Frontend (React 19 + Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Navbar.jsx      # Sticky navbar with search & badges
│   │   │   ├── Footer.jsx      # Campus links & guidelines
│   │   │   ├── ProductCard.jsx # Marketplace product card
│   │   │   ├── FilterSidebar.jsx # Category, price & condition filters
│   │   │   ├── Pagination.jsx  # Numbered pagination
│   │   │   ├── CheckoutModal.jsx # Razorpay checkout & summary
│   │   │   ├── ReviewModal.jsx # 5-star seller review dialog
│   │   │   ├── ConfirmModal.jsx# Accessible confirmation modal
│   │   │   └── AdminSidebar.jsx# Admin navigation sidebar
│   │   ├── context/            # Global state providers
│   │   │   ├── AuthContext.jsx # User auth & strict UoH regex check
│   │   │   ├── SocketContext.jsx # Socket.IO connection & badges
│   │   │   └── ToastContext.jsx# Toast notification system
│   │   ├── pages/              # Application views
│   │   │   ├── Landing.jsx     # Hero & category shortcuts
│   │   │   ├── Login.jsx       # Student & Admin sign in
│   │   │   ├── Register.jsx    # Student registration
│   │   │   ├── Marketplace.jsx # Full browse & search catalog
│   │   │   ├── ProductDetails.jsx # Image gallery & seller reviews
│   │   │   ├── AddProduct.jsx  # Multi-photo listing creation
│   │   │   ├── EditProduct.jsx # Listing editor & delist/delete
│   │   │   ├── Dashboard.jsx   # Student metrics & recent chats
│   │   │   ├── MyListings.jsx  # Active / Sold / Delisted tabs
│   │   │   ├── Wishlist.jsx    # Saved items
│   │   │   ├── Messages.jsx    # Split-pane live chat
│   │   │   ├── Orders.jsx      # Purchases, sales & rating modal
│   │   │   ├── Profile.jsx     # Student profile & feedback
│   │   │   ├── Settings.jsx    # Personal info & password update
│   │   │   └── admin/          # Admin Control Panel pages
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminUsers.jsx
│   │   │       ├── AdminProducts.jsx
│   │   │       ├── AdminCategories.jsx
│   │   │       ├── AdminOrders.jsx
│   │   │       └── AdminLogs.jsx
│   │   ├── services/           # Centralized API service
│   │   │   └── api.js
│   │   ├── App.jsx             # Routes & route guards
│   │   ├── index.css           # Custom responsive design system
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js          # Proxy configuration for API & WebSockets
├── server/                     # Backend (Node.js + Express + Socket.IO)
│   ├── config/                 # DB, Cloudinary, and Razorpay configs
│   │   ├── db.js               # PostgreSQL dual-mode (pg + PGlite)
│   │   ├── cloudinary.js       # Cloudinary with local storage fallback
│   │   └── razorpay.js         # Razorpay sandbox SDK integration
│   ├── controllers/            # Route controllers
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── categoryController.js
│   │   ├── wishlistController.js
│   │   ├── messageController.js
│   │   ├── paymentController.js
│   │   ├── reviewController.js
│   │   ├── notificationController.js
│   │   └── adminController.js
│   ├── middleware/             # Security, auth, and upload middlewares
│   │   ├── auth.js             # JWT verification & RBAC
│   │   ├── validate.js         # Strict @uohyd.ac.in regex validator
│   │   ├── upload.js           # Multer multi-file upload
│   │   └── errorHandler.js     # Centralized error handler
│   ├── routes/                 # Express API routes
│   ├── scripts/                # DDL migrations & database seeders
│   │   ├── schema.sql          # PostgreSQL DDL
│   │   └── seed.js             # 1 admin, 12+ students, 35+ products
│   ├── services/               # Socket.IO & notification dispatchers
│   │   ├── socketService.js
│   │   └── notificationService.js
│   ├── tests/                  # Automated integration test suite
│   │   └── apiTest.js          # 22 comprehensive backend tests
│   ├── package.json
│   ├── server.js               # Express & Socket.IO server entrypoint
│   └── .env.example
├── .gitignore
├── package.json                # Convenient root scripts
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v24 tested)
- **npm**: v9.0.0 or higher

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-username/uoh-marketplace.git
cd uoh-marketplace

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Configuration
Create `server/.env` based on `server/.env.example`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=uoh_marketplace_jwt_secret_campus_2026

# Database: Leave blank for instant embedded PostgreSQL (PGlite),
# or specify your external PostgreSQL connection string:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/uoh_marketplace

# Razorpay Test Sandbox Credentials
RAZORPAY_KEY_ID=rzp_test_uohmarketdemo123
RAZORPAY_KEY_SECRET=testsecret_uohmarket2026

# Optional: Cloudinary (falls back to local /uploads if not set)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 3. Seed Database
Run the database migration and realistic campus seeder:
```bash
cd server
npm run seed
```
This populates:
- 1 Campus Admin account (`admin@uohyd.ac.in`)
- 12 Verified UoH student accounts across diverse schools
- 8 Categories
- 35+ Campus products with images, wishlist items, completed orders, reviews, and audit logs.

---

## 🚀 Running the Application

### 1. Start Backend API & WebSocket Server
```bash
cd server
npm start
# Runs on http://localhost:5000
```

### 2. Start Frontend Client (Vite Dev Server)
In a separate terminal:
```bash
cd client
npm run dev
# Runs on http://localhost:5173
```
Open **`http://localhost:5173`** in your browser.

---

## 🔑 Pre-Seeded Sample Accounts

| Role | Email | Password | Department / Description |
|---|---|---|---|
| **Admin** | `admin@uohyd.ac.in` | `Admin@123` | Dean of Students Welfare (DSW) Office |
| **Student** | `vibhishan.kumar@uohyd.ac.in` | `Student@123` | School of Computer & Info Sciences |
| **Student** | `25mca01@uohyd.ac.in` | `Student@123` | MCA 2025 Student Representative |
| **Student** | `ananya.reddy@uohyd.ac.in` | `Student@123` | School of Chemistry |
| **Student** | `aarav.sharma@uohyd.ac.in` | `Student@123` | School of Physics |
| **Banned** | `banned.student@uohyd.ac.in` | `Student@123` | Demo suspended student account |

> On the Login page, click any of the **Quick Demo Accounts** buttons for instant one-click authentication.

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Register new student (Strictly validates `@uohyd.ac.in`, enforces `student` role).
- `POST /api/auth/login`: Authenticate student or admin, returns JWT. Rejects banned accounts with `403`.
- `GET /api/auth/me`: Get profile of authenticated user + summary stats.
- `PUT /api/auth/profile`: Update name, department, phone, or avatar.
- `POST /api/auth/forgot-password`: Generates reset token for UoH email.
- `POST /api/auth/reset-password`: Resets password using valid token.
- `PUT /api/auth/change-password`: Updates password with verification of old password.

### Marketplace Products (`/api/products`)
- `GET /api/products`: Browse active products with search (`q`), `category`, `condition`, `minPrice`, `maxPrice`, `sort`, `page`. Excludes sold, delisted, and banned user listings.
- `GET /api/products/:id`: Detailed view with seller reputation and verified reviews.
- `POST /api/products`: Create listing with multiple image uploads (Multipart form-data).
- `PUT /api/products/:id`: Edit product listing (owner only).
- `DELETE /api/products/:id`: Delete product listing (owner only).
- `PATCH /api/products/:id/status`: Mark product as `SOLD`.
- `GET /api/products/my-listings`: User's listed items (Active, Sold, Delisted).

### Wishlist (`/api/wishlist`)
- `GET /api/wishlist`: Returns user's saved products.
- `POST /api/wishlist/:productId`: Toggle item in/out of wishlist.

### Real-Time Messaging (`/api/messages`)
- `GET /api/messages/conversations`: List active chat threads with last message & unread badge count.
- `POST /api/messages/start`: Start conversation about a product.
- `GET /api/messages/conversations/:id`: Retrieve chat messages in chronological order.
- `POST /api/messages/conversations/:id`: Send message (dispatches real-time Socket.IO event).

### Payments & Orders (`/api/payments`)
- `POST /api/payments/create-order`: Create Razorpay checkout order for active item.
- `POST /api/payments/verify`: Verifies Razorpay HMAC signature, locks product row atomically, updates status to `SOLD`, creates order and payment records.
- `GET /api/payments/orders`: User purchase and sales history.
- `GET /api/payments/orders/:id`: Individual order invoice details.

### Reviews (`/api/reviews`)
- `POST /api/reviews`: Submit 1–5 star rating for completed purchase (Verified buyers only).
- `GET /api/reviews/seller/:sellerId`: List verified feedback and average rating.

### Notifications (`/api/notifications`)
- `GET /api/notifications`: List notifications + unread count.
- `PATCH /api/notifications/:id/read`: Mark single notification as read.
- `PATCH /api/notifications/read-all`: Mark all notifications as read.

### Administrative Control (`/api/admin` - Admin Role Only)
- `GET /api/admin/stats`: Total users, active/banned counts, orders, volume.
- `GET /api/admin/users`: Search and filter student accounts.
- `PATCH /api/admin/users/:id/ban`: Ban student account (`is_banned = true`).
- `PATCH /api/admin/users/:id/unban`: Restore student account (`is_banned = false`).
- `DELETE /api/admin/users/:id`: **Hard delete** cascading user record.
- `GET /api/admin/products`: Search and review all products.
- `PATCH /api/admin/products/:id/delist`: Delist product (`status = 'DELISTED'`).
- `PATCH /api/admin/products/:id/relist`: Relist product (`status = 'ACTIVE'`).
- `POST /api/admin/categories`: Add new category.
- `PUT /api/admin/categories/:id`: Edit category.
- `DELETE /api/admin/categories/:id`: Safe delete category (rejects if products exist).
- `GET /api/admin/orders`: View all platform transactions.
- `GET /api/admin/logs`: View audit log records.

---

## ⚡ Real-Time Socket.IO Architecture

Socket.IO handles instantaneous event delivery between campus students:

```mermaid
sequenceDiagram
    participant Buyer as Buyer Browser
    participant Server as Node.js Socket.IO Server
    participant Seller as Seller Browser

    Buyer->>Server: emit("typing", { conversationId, userName })
    Server-->>Seller: emit("user_typing", { conversationId, userName })

    Buyer->>Server: POST /api/messages/conversations/:id
    Server->>Server: Save message to PostgreSQL
    Server-->>Seller: emit("new_message", messageObject)
    Server-->>Seller: emit("new_notification", notificationObject)
```

1. **Authentication**: Handshake verifies JWT token (`socket.handshake.auth.token`).
2. **Rooms**: Every authenticated user joins a personal notification room `user_<id>`.
3. **Conversations**: Users join active chat rooms `conversation_<id>` for instant message delivery without polling.
4. **Broadcasts**: When a product is sold or delisted, a broadcast event updates connected clients in real time.

---

## 💳 Razorpay Sandbox Payment Flow & Concurrency Protection

```mermaid
sequenceDiagram
    participant Buyer as Buyer
    participant Client as React Client
    participant Server as Express Server
    participant DB as PostgreSQL Transaction
    participant Seller as Seller

    Buyer->>Client: Click "Buy Now"
    Client->>Server: POST /api/payments/create-order
    Server-->>Client: Return Razorpay Order ID & Amount
    Client->>Buyer: Open Checkout Modal
    Buyer->>Client: Confirm Campus Handover Spot & Pay
    Client->>Server: POST /api/payments/verify (Signature + Order ID)
    
    rect rgb(240, 248, 255)
        Note over Server,DB: Atomic PostgreSQL Transaction
        Server->>DB: BEGIN
        Server->>DB: SELECT * FROM products WHERE id = ? FOR UPDATE
        Server->>DB: Verify status == 'ACTIVE' (Rollback if SOLD)
        Server->>DB: UPDATE products SET status = 'SOLD'
        Server->>DB: INSERT INTO orders ...
        Server->>DB: INSERT INTO payments ...
        Server->>DB: COMMIT
    end

    Server-->>Seller: Dispatch "PRODUCT_SOLD" Notification
    Server-->>Client: 201 Created (Order Confirmed)
```

---

## ⚖️ Administrative Governance: Ban vs Delist vs Delete

| Action | Database Record | Visible to Normal Students | Reversible? | Impact |
|---|---|---|---|---|
| **Ban User** | Kept in DB (`is_banned = TRUE`) | No | **Yes** (Unban) | User cannot log in. Their products are hidden from the marketplace. Conversations preserved. |
| **Delist Product** | Kept in DB (`status = 'DELISTED'`) | No | **Yes** (Relist) | Product is hidden from public browse. Historical orders preserved. |
| **Delete User** | **Permanently Removed** | No | **No** (Permanent) | Cascades across tables: profile, listings, images, wishlist, messages, orders, and reviews are wiped. |

---

## 🧪 Automated Test Suite

A complete integration test suite verifies all critical business logic and requirements:

```bash
cd server
npm test
```

### Test Coverage (22 Assertions)
- ✅ `GET /api/health` returns healthy.
- ✅ Rejects non-`@uohyd.ac.in` emails on registration (`400 Bad Request`).
- ✅ Enforces `student` role on registration (prevents privilege escalation).
- ✅ Login succeeds for verified UoH students with valid JWT.
- ✅ Banned students blocked with `403 Forbidden`.
- ✅ Public catalog excludes items from suspended/banned students.
- ✅ Normal students forbidden from `/api/admin/*` endpoints (`403 Forbidden`).
- ✅ Admin accounts successfully access `/api/admin/stats` metrics.
- ✅ Product CRUD operations and image handling.
- ✅ Wishlist toggle operations.
- ✅ Razorpay order creation and payment verification.
- ✅ **Atomic double-purchase protection** (second purchase attempt rejected).
- ✅ Verified buyer review submission (1–5 stars).
- ✅ Rejects duplicate reviews for the same order.
- ✅ Admin Ban and Unban lifecycle.
- ✅ Admin Delist and Relist lifecycle.
- ✅ Admin activity audit logging.

---

## 📄 License

This project is licensed under the MIT License — created for the academic community of the **University of Hyderabad (UoH)**.
