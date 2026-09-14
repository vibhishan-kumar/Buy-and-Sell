const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function runSeed() {
  console.log('--- Initializing UoH Marketplace Database Migration & Seeding ---');
  await db.initDB();

  // 1. Run Schema Migration
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Applying database schema DDL...');
  await db.exec(schemaSql);
  console.log('Schema tables and indexes created successfully.');

  // 2. Hash Passwords
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const studentPassword = await bcrypt.hash('Student@123', 10);

  // 3. Seed Users
  console.log('Seeding campus accounts (Admin and UoH Students)...');

  // Admin user
  const adminRes = await db.query(
    `INSERT INTO users (name, email, password, department, phone, profile_image, role, is_banned)
     VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
     RETURNING id`,
    [
      'Campus Admin Office',
      'admin@uohyd.ac.in',
      adminPassword,
      'Dean of Students Welfare (DSW)',
      '+91 40 2313 0000',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      'admin'
    ]
  );
  const adminId = adminRes.rows[0].id;

  // Student accounts
  const students = [
    {
      name: 'Vibhishan Kumar',
      email: 'vibhishan.kumar@uohyd.ac.in',
      dept: 'School of Computer and Information Sciences',
      phone: '+91 98765 43210',
      img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
      banned: false
    },
    {
      name: 'Ananya Reddy',
      email: 'ananya.reddy@uohyd.ac.in',
      dept: 'School of Chemistry',
      phone: '+91 98765 43211',
      img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      banned: false
    },
    {
      name: 'Aarav Sharma',
      email: 'aarav.sharma@uohyd.ac.in',
      dept: 'School of Physics',
      phone: '+91 98765 43212',
      img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      banned: false
    },
    {
      name: 'Fatima Zahra',
      email: 'fatima.zahra@uohyd.ac.in',
      dept: 'Department of Life Sciences',
      phone: '+91 98765 43213',
      img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      banned: false
    },
    {
      name: 'MCA 2025 Student Rep',
      email: '25mca01@uohyd.ac.in',
      dept: 'School of Computer and Information Sciences',
      phone: '+91 98765 43214',
      img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      banned: false
    },
    {
      name: 'Rahul Verma',
      email: 'rahul.verma@uohyd.ac.in',
      dept: 'School of Economics',
      phone: '+91 98765 43215',
      img: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
      banned: false
    },
    {
      name: 'Priya Nair',
      email: 'priya.nair@uohyd.ac.in',
      dept: 'Department of English',
      phone: '+91 98765 43216',
      img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
      banned: false
    },
    {
      name: 'Karthik Subramanian',
      email: 'karthik.s@uohyd.ac.in',
      dept: 'School of Management Studies',
      phone: '+91 98765 43217',
      img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
      banned: false
    },
    {
      name: 'Divya Teja',
      email: 'divya.teja@uohyd.ac.in',
      dept: 'Department of Mathematics and Statistics',
      phone: '+91 98765 43218',
      img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      banned: false
    },
    {
      name: 'Sneha Patel',
      email: 'sneha.patel@uohyd.ac.in',
      dept: 'Department of Biotechnology',
      phone: '+91 98765 43219',
      img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
      banned: false
    },
    {
      name: 'Arjun Das',
      email: 'arjun.das@uohyd.ac.in',
      dept: 'Sarojini Naidu School of Arts & Communication',
      phone: '+91 98765 43220',
      img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
      banned: false
    },
    {
      name: 'Suspended Account Demo',
      email: 'banned.student@uohyd.ac.in',
      dept: 'Department of History',
      phone: '+91 98765 43221',
      img: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80',
      banned: true // Pre-banned user to test banned rules
    }
  ];

  const studentUserIds = [];
  for (const s of students) {
    const res = await db.query(
      `INSERT INTO users (name, email, password, department, phone, profile_image, role, is_banned)
       VALUES ($1, $2, $3, $4, $5, $6, 'student', $7)
       RETURNING id`,
      [s.name, s.email, studentPassword, s.dept, s.phone, s.img, s.banned]
    );
    studentUserIds.push(res.rows[0].id);
  }

  // 4. Seed Categories
  console.log('Seeding marketplace categories...');
  const categoriesData = [
    { name: 'Books & Study Materials', desc: 'Textbooks, reference manuals, course packs & lecture notes', icon: 'BookOpen' },
    { name: 'Electronics', desc: 'Monitors, laptops, headphones, calculators, keyboards & chargers', icon: 'Laptop' },
    { name: 'Furniture', desc: 'Study desks, chairs, bookshelves, mattresses & clothes racks', icon: 'Armchair' },
    { name: 'Hostel/Dorm Items', desc: 'Table fans, electric kettles, induction stoves, buckets & lighting', icon: 'Home' },
    { name: 'Clothing', desc: 'Lab coats, formal interview attire, winter jackets & campus hoodies', icon: 'Shirt' },
    { name: 'Sports', desc: 'Badminton rackets, footballs, cricket gear, gym weights & yoga mats', icon: 'Trophy' },
    { name: 'Vehicles/Bicycles', desc: 'Campus bicycles, gear cycles, helmets & bicycle locks', icon: 'Bike' },
    { name: 'Other', desc: 'Musical instruments, luggage bags, campus stationery & accessories', icon: 'Package' }
  ];

  const categoryMap = new Map();
  for (const c of categoriesData) {
    const res = await db.query(
      `INSERT INTO categories (name, description, icon)
       VALUES ($1, $2, $3)
       RETURNING id, name`,
      [c.name, c.desc, c.icon]
    );
    categoryMap.set(c.name, res.rows[0].id);
  }

  // 5. Seed 35+ Authentic UoH Products
  console.log('Seeding 35+ realistic campus products...');
  const products = [
    {
      sellerIdx: 0,
      cat: 'Books & Study Materials',
      name: 'Introduction to Algorithms (CLRS 4th Edition)',
      desc: 'Standard textbook for UoH MCA & M.Tech SCIS coursework. Very clean condition, minimal highlighting on dynamic programming chapters.',
      price: 850,
      condition: 'Good',
      loc: 'Men\'s Hostel J (MH-J), Room 214',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 1,
      cat: 'Books & Study Materials',
      name: 'Organic Chemistry - Paula Yurkanis Bruice (8th Ed)',
      desc: 'Mandatory reading for School of Chemistry MSc students. Includes reaction mechanism flowcharts tucked inside.',
      price: 600,
      condition: 'Like New',
      loc: 'Ladies Hostel B (LH-B), Ground Floor',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 2,
      cat: 'Books & Study Materials',
      name: 'Quantum Mechanics Concepts & Applications - Zettili',
      desc: 'Must-have for Physics MSc sem 1 and sem 2. Free handwritten solved problem booklet included with purchase.',
      price: 750,
      condition: 'Good',
      loc: 'School of Physics Common Room',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 3,
      cat: 'Books & Study Materials',
      name: 'Molecular Biology of the Cell - Alberts (6th Ed)',
      desc: 'Heavy hardbound reference for Life Sciences students. No torn pages, binding intact.',
      price: 1100,
      condition: 'Good',
      loc: 'Ladies Hostel A (LH-A)',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 4,
      cat: 'Books & Study Materials',
      name: 'Computer Networks - Andrew S. Tanenbaum',
      desc: 'Fifth edition. Covers routing protocols, subnetting, TCP/IP. Excellent condition, used for one semester.',
      price: 550,
      condition: 'Like New',
      loc: 'SCIS Building, 1st Floor Lab',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 5,
      cat: 'Books & Study Materials',
      name: 'Principles of Microeconomics - Mankiw',
      desc: 'Used for School of Economics coursework. Notes written in pencil in margins.',
      price: 450,
      condition: 'Fair',
      loc: 'MH-K Hostel, Room 108',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 0,
      cat: 'Electronics',
      name: 'Casio FX-991EX ClassWiz Scientific Calculator',
      desc: 'Allowed in all university examinations. Natural textbook display with matrix/vector modes. Battery replaced last month.',
      price: 900,
      condition: 'Like New',
      loc: 'South Campus Shopping Complex',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 4,
      cat: 'Electronics',
      name: 'Dell UltraSharp 24" IPS FHD Monitor',
      desc: 'Super crisp IPS panel, height-adjustable stand, HDMI and DisplayPort. Great for programming and research paper reading.',
      price: 6500,
      condition: 'Like New',
      loc: 'MH-J Hostel, Room 312',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 2,
      cat: 'Electronics',
      name: 'Logitech MX Master 3S Wireless Ergonomic Mouse',
      desc: 'Dark grey, silent clicks, magnetic scroll wheel. Connects via Bluetooth or Bolt receiver. Battery lasts months.',
      price: 4200,
      condition: 'Like New',
      loc: 'School of Physics Library Gate',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 1,
      cat: 'Electronics',
      name: 'Kindle Paperwhite 10th Gen (8GB, Waterproof)',
      desc: 'Glare-free screen with adjustable warm light. Perfect for reading PDFs, books, and papers late at night in dorm.',
      price: 4900,
      condition: 'Good',
      loc: 'LH-B Canteen',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1544716278-e513176f20b5?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 5,
      cat: 'Electronics',
      name: 'Sony WH-CH520 Wireless Bluetooth Headphones',
      desc: '50-hour battery life, multipoint connection, lightweight. Used for attending virtual symposiums and study sessions.',
      price: 2400,
      condition: 'Like New',
      loc: 'Indira Gandhi Memorial Library entrance',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 3,
      cat: 'Electronics',
      name: 'Mi 20000mAh Power Bank (18W Fast Charging)',
      desc: 'Dual USB output, supports fast charging. Essential during campus power maintenance or library sessions.',
      price: 950,
      condition: 'Good',
      loc: 'LH-A Recreation Room',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1609592807758-c4193b2a26c4?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 0,
      cat: 'Vehicles/Bicycles',
      name: 'Hercules Roadeo A50 Mountain Bike (Campus Commuter)',
      desc: 'Front suspension, 21-speed Shimano gears, sturdy aluminum frame. Ideal for riding between North and South Campus through Lake Road. Free heavy lock included.',
      price: 4500,
      condition: 'Good',
      loc: 'MH-J Bicycle Parking',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 6,
      cat: 'Vehicles/Bicycles',
      name: 'Hero Sprint Single-Speed Campus Cycle',
      desc: 'Low-maintenance, brand new rear tire and brake pads. Smooth pedaling for daily commute to Humanities block.',
      price: 2800,
      condition: 'Good',
      loc: 'Golden Threshold Block / Old Campus',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 7,
      cat: 'Vehicles/Bicycles',
      name: 'Btwin Riverside 120 Hybrid Cycle',
      desc: 'Lightweight hybrid bicycle with 8 gears. Purchased from Decathlon 1 year ago. Original bill available.',
      price: 5800,
      condition: 'Like New',
      loc: 'School of Management Studies Porch',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 0,
      cat: 'Hostel/Dorm Items',
      name: 'Orient 400mm Silent Table Fan (Aerocool)',
      desc: 'High-speed 3-blade table fan with 90-degree oscillation. Very silent for late-night exam prep. Keeps the hostel room cool.',
      price: 1100,
      condition: 'Good',
      loc: 'MH-J Hostel',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1618941716939-553df3c6c278?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 1,
      cat: 'Hostel/Dorm Items',
      name: 'Bajaj 1.5L Stainless Steel Electric Kettle',
      desc: 'Automatic shut-off, boil-dry protection. Great for boiling water, Maggi noodles, green tea, and coffee in dorms.',
      price: 650,
      condition: 'Like New',
      loc: 'LH-B Hostel',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 4,
      cat: 'Hostel/Dorm Items',
      name: 'Prestige 2000W Induction Cooktop',
      desc: 'Indian menu options, flame-free and safe for hostel pantry rooms. Energy-saving preset timer.',
      price: 1600,
      condition: 'Good',
      loc: 'SCIS Hostel Cluster',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 2,
      cat: 'Hostel/Dorm Items',
      name: 'LED Desk Lamp with Wireless Phone Charger Base',
      desc: '3 lighting modes (Warm, Natural, Cool White) with touch brightness control. Includes USB charging port.',
      price: 750,
      condition: 'Like New',
      loc: 'Physics Department Block',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 5,
      cat: 'Hostel/Dorm Items',
      name: 'Philips 1000W Non-Stick Dry Iron Box',
      desc: 'Uniform heating, lightweight, perfect for ironing formal clothes for placement drives and seminars.',
      price: 480,
      condition: 'Good',
      loc: 'MH-K Hostel',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 3,
      cat: 'Hostel/Dorm Items',
      name: 'Foldable 4-Tier Metal Shoe Rack & Clothes Drying Stand',
      desc: 'Compact collapsible design that fits comfortably in hostel room corners. Rust-resistant coating.',
      price: 600,
      condition: 'Good',
      loc: 'LH-A Hostel',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 0,
      cat: 'Furniture',
      name: 'Solid Engineered Wood Study Table with Bookshelf Rack',
      desc: 'Spacious desk (3.5 x 2 ft) with built-in 2-tier shelves for files, monitor, and textbooks. Very sturdy.',
      price: 2200,
      condition: 'Good',
      loc: 'MH-J Hostel, Room 214',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 7,
      cat: 'Furniture',
      name: 'Ergonomic Mesh Study Chair with Lumbar Support',
      desc: 'Breathable back mesh, hydraulic height adjustment, 360-degree swivel wheels. Excellent for long coding or study hours.',
      price: 2600,
      condition: 'Like New',
      loc: 'School of Management Studies Hostel wing',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1580481077197-2a5cb9b5e3ee?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 6,
      cat: 'Furniture',
      name: 'High Density 4-inch Single Foam Mattress (3 x 6 ft)',
      desc: 'Fits standard UoH hostel cots. Sanitized and covered with removable washable zipper cover. Free bedsheet included.',
      price: 1200,
      condition: 'Good',
      loc: 'Humanities Hostel Wing',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 8,
      cat: 'Furniture',
      name: 'Multipurpose Foldable Bed Table with Tablet Slot & Cup Holder',
      desc: 'Non-slip legs, lightweight MDF board. Great for studying while sitting on bed or during winter nights.',
      price: 350,
      condition: 'Like New',
      loc: 'Mathematics Dept Hostel',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1533090161767-e6ffed986b88?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 1,
      cat: 'Clothing',
      name: 'UoH Chemistry Lab Coat (100% Pure White Cotton, Size 38)',
      desc: 'Standard knee-length lab coat with university department chest embroidery. Cleanly washed and ironed, zero acid burns.',
      price: 320,
      condition: 'Good',
      loc: 'School of Chemistry Foyer',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 7,
      cat: 'Clothing',
      name: 'Men\'s Formal Blazer & Trousers Set for Campus Placements (Raymond 38R)',
      desc: 'Charcoal grey slim-fit two-piece suit. Worn twice during campus recruitment interviews. Dry-cleaned.',
      price: 2400,
      condition: 'Like New',
      loc: 'SMS Placement Cell',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 5,
      cat: 'Clothing',
      name: 'Wildcraft Campus Water-Resistant Winter Jacket (Size L)',
      desc: 'Thermal fleece inner lining, olive green color. Keeps warm during chilly early morning Hyderabad winters.',
      price: 1100,
      condition: 'Like New',
      loc: 'South Campus Food Court',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 9,
      cat: 'Sports',
      name: 'Yonex Astrox 77 Badminton Racket + Full Thermal Cover',
      desc: 'Strung with BG65 titanium string at 26 lbs tension. Used at UoH Indoor Stadium. Grip is brand new.',
      price: 2300,
      condition: 'Good',
      loc: 'UoH Indoor Stadium Sports Complex',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 2,
      cat: 'Sports',
      name: 'Nivia Storm Football (Size 5, FIFA Quality Standard)',
      desc: 'Thermally bonded 32-panel football. Used for a few friendly matches at the University Main Ground.',
      price: 450,
      condition: 'Good',
      loc: 'University Main Ground Pavilion',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 0,
      cat: 'Sports',
      name: 'Kashmir Willow Cricket Bat (Full Size SH) + Grip & Scuff Sheet',
      desc: 'Great ping for tennis cricket matches in hostel corridors or turf grounds. Knocked-in with linseed oil.',
      price: 850,
      condition: 'Good',
      loc: 'MH-J Ground',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 10,
      cat: 'Other',
      name: 'Yamaha F310 Acoustic Guitar with Padded Gig Bag & Tuner',
      desc: 'Spruce top, rich warm acoustic tone, low action with D\'Addario phosphor bronze strings. Loved by campus music society.',
      price: 5200,
      condition: 'Good',
      loc: 'SN School Amphitheatre',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 4,
      cat: 'Other',
      name: 'American Tourister 32L Rainproof Laptop Backpack',
      desc: '3 large compartments, dedicated 15.6" padded sleeve, secret anti-theft pocket. Clean condition.',
      price: 900,
      condition: 'Like New',
      loc: 'SCIS Hostel',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 1,
      cat: 'Other',
      name: 'HP DeskJet 2331 Color All-in-One Inkjet Printer',
      desc: 'Print, scan, copy. Save time and money instead of going to campus photocopy shops. USB cable included.',
      price: 1900,
      condition: 'Good',
      loc: 'Shopping Complex Photocopy Point',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80'
    },
    {
      sellerIdx: 11, // Banned student listing
      cat: 'Electronics',
      name: 'Noise Cancelling Wireless Earbuds (Demo Suspended Item)',
      desc: 'This item belongs to a suspended account and should be hidden from general marketplace browse.',
      price: 1200,
      condition: 'Good',
      loc: 'Campus',
      status: 'ACTIVE',
      img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const productIds = [];
  for (const p of products) {
    const sellerId = studentUserIds[p.sellerIdx];
    const catId = categoryMap.get(p.cat);

    const res = await db.query(
      `INSERT INTO products (seller_id, category_id, name, description, price, condition, location, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [sellerId, catId, p.name, p.desc, p.price, p.condition, p.loc, p.status]
    );

    const prodId = res.rows[0].id;
    productIds.push(prodId);

    // Insert primary image
    await db.query(
      `INSERT INTO product_images (product_id, image_url, is_primary)
       VALUES ($1, $2, TRUE)`,
      [prodId, p.img]
    );

    // Add secondary angle image
    await db.query(
      `INSERT INTO product_images (product_id, image_url, is_primary)
       VALUES ($1, $2, FALSE)`,
      [prodId, p.img]
    );
  }

  // 6. Seed Sample Wishlist Entries
  console.log('Seeding sample student wishlist items...');
  const wishlistPairs = [
    [studentUserIds[0], productIds[1]],
    [studentUserIds[0], productIds[7]],
    [studentUserIds[1], productIds[0]],
    [studentUserIds[1], productIds[12]],
    [studentUserIds[2], productIds[6]],
    [studentUserIds[3], productIds[0]],
    [studentUserIds[4], productIds[13]]
  ];

  for (const [uid, pid] of wishlistPairs) {
    await db.query(
      'INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [uid, pid]
    );
  }

  // 7. Seed Sample Completed Orders & Payments & Reviews
  console.log('Seeding completed campus purchase orders & ratings...');
  // Let student 1 (Ananya) buy product 6 (Casio Calculator) from student 0 (Vibhishan)
  const order1Prod = products[6];
  const order1ProdId = productIds[6];
  const buyerId1 = studentUserIds[1];
  const sellerId1 = studentUserIds[order1Prod.sellerIdx];

  // Mark product 6 as SOLD
  await db.query("UPDATE products SET status = 'SOLD' WHERE id = $1", [order1ProdId]);

  const ord1Res = await db.query(
    `INSERT INTO orders (order_number, product_id, buyer_id, seller_id, amount, platform_fee, total_amount, status, delivery_location)
     VALUES ($1, $2, $3, $4, $5, 0.00, $6, 'COMPLETED', 'LH-B Common Room Gate')
     RETURNING id`,
    ['UOH-ORD-17104001-9921', order1ProdId, buyerId1, sellerId1, order1Prod.price, order1Prod.price]
  );
  const order1Id = ord1Res.rows[0].id;

  await db.query(
    `INSERT INTO payments (order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, currency, payment_status)
     VALUES ($1, 'order_rzp_demo_1001', 'pay_rzp_demo_2001', 'sandbox_sig_verified_1001', $2, 'INR', 'SUCCESS')`,
    [order1Id, order1Prod.price]
  );

  // Review from buyer 1 to seller 0
  await db.query(
    `INSERT INTO reviews (order_id, seller_id, buyer_id, rating, review_text)
     VALUES ($1, $2, $3, 5, 'Calculator is in pristine condition with original box! Vibhishan was on time at the meeting spot. Highly recommended!')`,
    [order1Id, sellerId1, buyerId1]
  );

  // 8. Seed Sample Conversations & Messages
  console.log('Seeding real-time student conversations & chat history...');
  const convRes = await db.query(
    `INSERT INTO conversations (product_id, buyer_id, seller_id)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [productIds[0], studentUserIds[1], studentUserIds[0]]
  );
  const convId = convRes.rows[0].id;

  const chatMessages = [
    { sender: studentUserIds[1], text: 'Hi Vibhishan! Is the CLRS Algorithms book still available?' },
    { sender: studentUserIds[0], text: 'Hey Ananya! Yes, it is available. Clean pages, no missing sheets.' },
    { sender: studentUserIds[1], text: 'Awesome! Can we meet near South Campus Shopping Complex around 5 PM?' },
    { sender: studentUserIds[0], text: 'Sure, 5 PM works perfectly for me. See you there!' }
  ];

  for (const m of chatMessages) {
    await db.query(
      `INSERT INTO messages (conversation_id, sender_id, message_text, is_read)
       VALUES ($1, $2, $3, TRUE)`,
      [convId, m.sender, m.text]
    );
  }

  // 9. Seed Sample Notifications
  console.log('Seeding student & admin notifications...');
  await db.query(
    `INSERT INTO notifications (user_id, type, title, message, link, is_read)
     VALUES 
     ($1, 'WELCOME', 'Welcome to UoH Marketplace!', 'Discover and buy textbooks, electronics, and dorm items from fellow Hyderabad University students.', '/marketplace', FALSE),
     ($1, 'NEW_MESSAGE', 'New message from Ananya Reddy', 'Sure, 5 PM works perfectly for me. See you there!', '/messages', FALSE),
     ($1, 'PAYMENT_SUCCESS', 'Payment Received for Casio Calculator', 'Ananya Reddy purchased your Casio Calculator for ₹900.', '/orders', TRUE)`,
    [studentUserIds[0]]
  );

  // 10. Seed Admin Activity Logs
  console.log('Seeding administrative audit trail logs...');
  const logs = [
    { action: 'SEED_DATABASE', type: 'SYSTEM', desc: 'System seeded initial UoH campus categories and student records.' },
    { action: 'ADD_CATEGORY', type: 'CATEGORY', desc: 'Created verified category "Books & Study Materials".' },
    { action: 'BAN_USER', type: 'USER', desc: 'Suspended account for suspicious activity: suspended.student@uohyd.ac.in' }
  ];

  for (const l of logs) {
    await db.query(
      `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, description)
       VALUES ($1, $2, $3, NULL, $4)`,
      [adminId, l.action, l.type, l.desc]
    );
  }

  console.log('----------------------------------------------------');
  console.log(' Database Seeding Completed Successfully!');
  console.log(` Admin Account: admin@uohyd.ac.in (Password: Admin@123)`);
  console.log(` Student Account: vibhishan.kumar@uohyd.ac.in (Password: Student@123)`);
  console.log(` Student Account: 25mca01@uohyd.ac.in (Password: Student@123)`);
  console.log(` Total Categories: ${categoryMap.size}`);
  console.log(` Total Products: ${products.length}`);
  console.log('----------------------------------------------------');
}

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal seed error:', err);
      process.exit(1);
    });
}

module.exports = { runSeed };
