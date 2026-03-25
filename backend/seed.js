const pool = require('./db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Define Business Types and their potential companies (top-level categories map)
const businessTypes = {
  'Accounting & Financial Services': [
    'Accounting',
    'Bookkeeping',
    'Tax Services',
    'Payroll Services',
    'Financial Consulting',
    'Auditing',
  ],

  'Advertising & Marketing': [
    'Digital Marketing',
    'Social Media Marketing',
    'Branding',
    'Advertising Agencies',
    'SEO Services',
    'Content Creation',
  ],

  'Agriculture & Farming': [
    'Crop Farming',
    'Livestock Farming',
    'Agricultural Equipment',
    'Seed & Fertilizer Suppliers',
    'Irrigation Services',
  ],

  'Architecture & Engineering': [
    'Architectural Design',
    'Structural Engineering',
    'Civil Engineering',
    'Urban Planning',
    'Building Design',
  ],

  Automotive: [
    'Vehicle Sales',
    'Auto Repairs',
    'Auto Parts',
    'Car Wash & Detailing',
    'Auto Electrical',
    'Tyres & Wheels',
  ],

  'Beauty & Personal Care': [
    'Hair Salons',
    'Barbers',
    'Nail Salons',
    'Makeup Artists',
    'Spas & Massage',
    'Beauty Products',
  ],

  'Building & Construction': [
    'Building Contractors',
    'Renovations',
    'Roofing',
    'Painting',
    'Tiling',
    'Carpentry',
  ],

  'Catering & Food Services': [
    'Restaurants',
    'Cafes',
    'Takeaways',
    'Catering Services',
    'Bakeries',
    'Food Suppliers',
  ],

  'Childcare & Education': [
    'Daycare',
    'Tutoring',
    'Private Schools',
    'Music Lessons',
    'Driving Schools',
  ],

  'Cleaning & Maintenance': [
    'House Cleaning',
    'Office Cleaning',
    'Laundry Services',
    'Dry Cleaning',
    'Waste Removal',
  ],

  'Clothing & Fashion': [
    'Clothing Boutiques',
    'Fashion Designers',
    'Tailoring & Alterations',
    'Shoe Stores',
    'Accessories',
  ],

  'Computer & IT Services': [
    'Computer Sales',
    'Computer Repairs',
    'IT Support',
    'Network Installation',
    'Cyber Security',
  ],

  'Creative & Design': [
    'Graphic Design',
    'Photography',
    'Videography',
    'Illustration',
    'Animation',
  ],

  'Digital & Online Services': [
    'Website Development',
    'App Development',
    'E-commerce Development',
    'UI/UX Design',
    'Software Development',
  ],

  'Electrical Services': [
    'Electrical Installation',
    'Electrical Repairs',
    'Solar Installation',
    'Generator Installation',
  ],

  'Event Services': [
    'Event Planning',
    'Event Decor',
    'Sound & Lighting',
    'Wedding Planning',
    'Corporate Events',
  ],

  'Fitness & Sports': [
    'Gyms',
    'Personal Trainers',
    'Yoga Studios',
    'Sports Coaching',
    'Sports Equipment',
  ],

  'Florists & Gifts': [
    'Florists',
    'Gift Shops',
    'Custom Gift Boxes',
    'Greeting Cards',
  ],

  'Furniture & Home Decor': [
    'Furniture Stores',
    'Interior Design',
    'Home Decor',
    'Lighting',
    'Kitchen Design',
  ],

  'Garden & Landscaping': [
    'Landscaping',
    'Garden Maintenance',
    'Garden Design',
    'Nurseries',
  ],

  'Health & Medical': [
    'Clinics',
    'Doctors',
    'Dentists',
    'Physiotherapy',
    'Nutritionists',
  ],

  'Hospitality & Accommodation': [
    'Hotels',
    'Bed & Breakfast',
    'Guest Houses',
    'Lodges',
  ],

  'Insurance Services': [
    'Life Insurance',
    'Health Insurance',
    'Vehicle Insurance',
    'Business Insurance',
  ],

  'Jewelry & Luxury Goods': [
    'Jewelry Stores',
    'Custom Jewelry',
    'Watch Stores',
    'Luxury Accessories',
  ],

  'Kids & Baby': ['Baby Stores', 'Kids Clothing', 'Toys', 'Kids Entertainment'],

  'Legal Services': ['Law Firms', 'Legal Consulting', 'Notary Services'],

  'Logistics & Transport': [
    'Courier Services',
    'Freight Services',
    'Moving Companies',
    'Warehousing',
  ],

  'Marketing & Media': [
    'Advertising Agencies',
    'Public Relations',
    'Media Production',
    'Marketing Consulting',
  ],

  'Medical Supplies & Pharmacies': [
    'Pharmacies',
    'Medical Equipment',
    'Health Supplies',
  ],

  'Mobile Phones & Electronics': [
    'Mobile Phone Stores',
    'Phone Repairs',
    'Electronics Stores',
    'Accessories',
  ],

  'Pet Services': ['Pet Shops', 'Veterinary Clinics', 'Pet Grooming'],

  'Plumbing & Water Services': [
    'Plumbing Installation',
    'Plumbing Repairs',
    'Water Systems',
    'Borehole Services',
  ],

  'Printing & Branding': [
    'Printing Services',
    'Signage',
    'Promotional Products',
    'Corporate Branding',
  ],

  'Property & Real Estate': [
    'Real Estate Agencies',
    'Property Management',
    'Property Development',
    'Property Sales',
  ],

  'Security Services': [
    'Security Companies',
    'CCTV Installation',
    'Alarm Systems',
    'Access Control',
  ],

  'Solar & Energy': [
    'Solar Installations',
    'Solar Equipment',
    'Energy Consulting',
  ],

  'Travel & Tourism': [
    'Travel Agencies',
    'Tour Operators',
    'Safari Tours',
    'Holiday Packages',
  ],

  'Vehicle Hire & Transport': [
    'Car Hire',
    'Taxi Services',
    'Bus Hire',
    'Airport Transfers',
  ],

  Weddings: [
    'Wedding Planners',
    'Wedding Venues',
    'Wedding Photographers',
    'Wedding Decor',
  ],

  'Wellness & Lifestyle': [
    'Spas',
    'Massage Therapy',
    'Holistic Wellness',
    'Life Coaching',
  ],
};

const branches = [
  'Avondale',
  'Borrowdale',
  'CBD',
  'First Street',
  'Jason Moyo',
  'Mbare',
  'Highfield',
  'Greendale',
  'Msasa',
  'Eastgate',
  "Sam Levy's Village",
  'Westgate',
  'Chisipite',
  'Kamfinsa',
  'Groombridge',
  'Bulawayo CBD',
  'Belmont',
  'Hillside',
  'Gweru',
  'Mutare',
  'Masvingo',
  'Chinhoyi',
  'Marondera',
  'Victoria Falls',
  'Bindura',
];

const branchLocations = {
  // HARARE
  Avondale: { lat: -17.7981, lng: 31.0416 },
  Borrowdale: { lat: -17.7554, lng: 31.0963 },
  CBD: { lat: -17.8252, lng: 31.053 },
  'First Street': { lat: -17.8294, lng: 31.0539 },
  'Jason Moyo': { lat: -17.8306, lng: 31.0505 },
  Mbare: { lat: -17.8596, lng: 31.0347 },
  Highfield: { lat: -17.8967, lng: 30.9959 },
  Greendale: { lat: -17.8183, lng: 31.1444 },
  Msasa: { lat: -17.8386, lng: 31.1097 },
  Eastgate: { lat: -17.8318, lng: 31.0598 },
  "Sam Levy's Village": { lat: -17.7567, lng: 31.097 },
  Westgate: { lat: -17.7816, lng: 30.9856 },
  Chisipite: { lat: -17.7885, lng: 31.1398 },
  Kamfinsa: { lat: -17.8144, lng: 31.1492 },
  Groombridge: { lat: -17.7719, lng: 31.0772 },
  // OTHER
  'Bulawayo CBD': { lat: -20.1437, lng: 28.5866 },
  Belmont: { lat: -20.1667, lng: 28.5667 },
  Hillside: { lat: -20.1833, lng: 28.6 },
  Gweru: { lat: -19.4623, lng: 29.8131 },
  Mutare: { lat: -18.9728, lng: 32.6694 },
  Masvingo: { lat: -20.072, lng: 30.8296 },
  Chinhoyi: { lat: -17.3667, lng: 30.2 },
  Marondera: { lat: -18.1884, lng: 31.5511 },
  'Victoria Falls': { lat: -17.9326, lng: 25.8304 },
  Bindura: { lat: -17.3013, lng: 31.3285 },
};

// Organized by seed category for matching
const productsPool = {
  Supermarket: [
    {
      name: 'Chimombe Fresh Milk 500ml',
      price: 0.8,
      category: 'Milk and Dairy',
      image:
        'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=60',
    },
    {
      name: 'Mahatma Rice 2kg',
      price: 2.8,
      category: 'Food',
      image:
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=60',
    },
    {
      name: 'Gloria Self Raising Flour 2kg',
      price: 2.3,
      category: 'Baking',
      image:
        'https://images.unsplash.com/photo-1627485937980-221c88ac04f9?w=500&q=60',
    },
    {
      name: 'Zimgold Cooking Oil 2L',
      price: 3.5,
      category: 'Food',
      image:
        'https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=500&q=60',
    },
    {
      name: 'Mazoe Orange Crush 2L',
      price: 3.2,
      category: 'Juice',
      image:
        'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=60',
    },
    {
      name: 'Sunlight Dishwashing Liquid',
      price: 1.8,
      category: 'Cleaning',
      image:
        'https://images.unsplash.com/photo-1585849834952-094e9f78318a?w=500&q=60',
    },
  ],
  Butchery: [
    {
      name: 'Beef Stew (per kg)',
      price: 6.5,
      category: 'Meat',
      image:
        'https://images.unsplash.com/photo-1603048297172-c92544798d5e?w=500&q=60',
    },
    {
      name: 'Pork Chops (per kg)',
      price: 5.5,
      category: 'Meat',
      image:
        'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=500&q=60',
    },
    {
      name: 'Boerewors (per kg)',
      price: 7.0,
      category: 'Meat',
      image:
        'https://images.unsplash.com/photo-1544378730-8b5104b13793?w=500&q=60',
    },
    {
      name: 'Whole Chicken',
      price: 6.0,
      category: 'Meat',
      image:
        'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&q=60',
    },
    {
      name: 'T-Bone Steak (per kg)',
      price: 9.0,
      category: 'Meat',
      image:
        'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=500&q=60',
    },
  ],
  'Fresh Produce': [
    {
      name: 'Potatoes (15kg Pocket)',
      price: 8.0,
      category: 'Food',
      image:
        'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&q=60',
    },
    {
      name: 'Fresh Tomatoes (per kg)',
      price: 1.5,
      category: 'Food',
      image:
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=60',
    },
    {
      name: 'Bananas (per kg)',
      price: 1.0,
      category: 'Food',
      image:
        'https://images.unsplash.com/photo-1571771896612-411394c979d6?w=500&q=60',
    },
    {
      name: 'Onions (10kg Pocket)',
      price: 7.0,
      category: 'Food',
      image:
        'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&q=60',
    },
    {
      name: 'Cabbages (Head)',
      price: 0.5,
      category: 'Food',
      image:
        'https://images.unsplash.com/photo-1552590635-27c2c2128abf?w=500&q=60',
    },
  ],
  Bakery: [
    {
      name: 'Standard White Loaf',
      price: 1.0,
      category: 'Bread',
      image:
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=60',
    },
    {
      name: 'Whole Wheat Bread',
      price: 1.1,
      category: 'Bread',
      image:
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=60',
    },
    {
      name: 'Chocolate Donuts (6 Pack)',
      price: 3.0,
      category: 'Baking',
      image:
        'https://images.unsplash.com/photo-1551024601-564d6dbf4e96?w=500&q=60',
    },
    {
      name: 'Meat Pies',
      price: 1.25,
      category: 'Food',
      image:
        'https://images.unsplash.com/photo-1572383672419-ab47799aa31f?w=500&q=60',
    },
    {
      name: 'Birthday Cake',
      price: 15.0,
      category: 'Baking',
      image:
        'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&q=60',
    },
  ],
  Liquor: [
    {
      name: 'Castle Lager Case (24)',
      price: 18.0,
      category: 'Drinks',
      image:
        'https://images.unsplash.com/photo-1618183183531-29143f798e4e?w=500&q=60',
    },
    {
      name: 'Zambezi Lager 6-Pack',
      price: 6.0,
      category: 'Drinks',
      image:
        'https://images.unsplash.com/photo-1600269450099-58d52c281df6?w=500&q=60',
    },
    {
      name: 'Whisky 750ml',
      price: 25.0,
      category: 'Drinks',
      image:
        'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=500&q=60',
    },
    {
      name: 'Red Wine Bottle',
      price: 8.0,
      category: 'Drinks',
      image:
        'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500&q=60',
    },
    {
      name: 'Gin 750ml',
      price: 15.0,
      category: 'Drinks',
      image:
        'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=500&q=60',
    },
  ],
};

async function seed() {
  try {
    console.log(' Starting seed process...');

    // Drop tables to valid schema updates
    await pool.query('DROP TABLE IF EXISTS products CASCADE');
    await pool.query('DROP TABLE IF EXISTS businesses CASCADE');

    // 0. Create Tables (Condensed for brevity of updates)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) CHECK (role IN ('customer', 'business', 'admin')) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS businesses (
          id SERIAL PRIMARY KEY,
          owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(100),
          subcategory VARCHAR(100),
          location VARCHAR(255),
          website VARCHAR(255),
          phone_number VARCHAR(50),
          email VARCHAR(255),
          employee_count VARCHAR(50),
          is_active BOOLEAN DEFAULT TRUE,
          is_verified BOOLEAN DEFAULT FALSE,
          average_rating NUMERIC(3, 2) DEFAULT 0,
          review_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          latitude NUMERIC(10, 6) DEFAULT -17.8252,
          longitude NUMERIC(10, 6) DEFAULT 31.0530,
          logo_url TEXT,
          mall_id INTEGER REFERENCES malls(id)
      );
          CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE
          );
      CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price NUMERIC(10, 2),
          category VARCHAR(100),
          average_rating NUMERIC(3, 2) DEFAULT 0,
          review_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          image_url TEXT,
          promotion_type VARCHAR(50),
          discount_percent INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE
      );
    `);

    // 1. Clean existing data
    console.log(' Cleaning old data...');
    // Note: Adjust table names if needed. Order matters for cascade.
    // Try graceful truncate (Excluding users)
    try {
      await pool.query('TRUNCATE TABLE products, businesses CASCADE');
    } catch (e) {
      console.log('Error truncating, tables might not exist yet: ' + e.message);
    }

    const passwordHash = await bcrypt.hash('password123', 10);
    const createdBusinesses = [];

    // 2. Insert Malls (seed list)
    console.log(' Seeding malls...');
    const mallNames = [
      'Portal Village',
      '101 on Churchill',
      'Hunters Moon',
      '68 Ridgeway',
      'Newlands Shopping Centre',
      'Rhodesville Mall',
      'Kudu Corner',
      'Paddington Square',
      'Chizi Walk',
      'Chisipiti Shops',
      'Highlands Park',
      'Kamfinsa Shopping Centre',
      'Westgate Shopping Centre',
      'Arundel Village',
      'Groombridge Shops',
      'Honeydew Lifestyle Centre',
      "Sam Levy's Village",
      'Village Walk',
      'Shamwari Complex',
      'Kensington Shops',
    ];

    const mallIds = [];
    for (const m of mallNames) {
      // check existing
      const existing = await pool.query('SELECT id FROM malls WHERE name=$1', [
        m,
      ]);
      if (existing.rows.length) {
        mallIds.push(existing.rows[0].id);
        continue;
      }
      const r = await pool.query(
        `INSERT INTO malls (name) VALUES ($1) RETURNING id`,
        [m]
      );
      mallIds.push(r.rows[0].id);
    }

    // 3. Create Businesses
    console.log(' Creating Diversified Businesses...');

    // We want about 50 businesses total, distributed among categories
    const categories = Object.keys(businessTypes);

    // Seed categories and subcategories into categories table
    console.log(' Seeding categories into categories table...');
    const categoryMap = {};
    for (const [parentName, subs] of Object.entries(businessTypes)) {
      // create parent if not exists
      const existingParent = await pool.query(
        'SELECT id FROM categories WHERE name=$1 AND parent_id IS NULL',
        [parentName]
      );
      let parentId;
      if (existingParent.rows.length) parentId = existingParent.rows[0].id;
      else {
        const r = await pool.query(
          'INSERT INTO categories (name, parent_id) VALUES ($1, NULL) RETURNING id',
          [parentName]
        );
        parentId = r.rows[0].id;
      }
      categoryMap[parentName] = { id: parentId, subs: {} };

      // create subcategories
      for (const s of subs) {
        const existingSub = await pool.query(
          'SELECT id FROM categories WHERE name=$1 AND parent_id=$2',
          [s, parentId]
        );
        if (existingSub.rows.length) {
          categoryMap[parentName].subs[s] = existingSub.rows[0].id;
        } else {
          const r2 = await pool.query(
            'INSERT INTO categories (name, parent_id) VALUES ($1, $2) RETURNING id',
            [s, parentId]
          );
          categoryMap[parentName].subs[s] = r2.rows[0].id;
        }
      }
    }

    for (let i = 0; i < 50; i++) {
      // Pick a category
      const category = categories[i % categories.length]; // cycle through types
      // Pick a company (Deterministic)
      const companyList = businessTypes[category];
      const company = companyList[i % companyList.length];
      // Pick a branch (Deterministic)
      const branch = branches[i % branches.length];

      const businessName = `${company} ${branch}`;
      const email = `manager${i}@${company.toLowerCase().replace(/[^a-z]/g, '')}.co.zw`;

      // Find or Create User
      let ownerId;
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        ownerId = existingUser.rows[0].id;
      } else {
        const userRes = await pool.query(
          `INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id`,
          [`Manager of ${businessName}`, email, passwordHash, 'business']
        );
        ownerId = userRes.rows[0].id;
      }

      // Create Business
      const location = `${branch}, Zimbabwe`;
      const description = `Your trusted details for ${category.toLowerCase()} in ${branch}.`;
      const baseCoords = branchLocations[branch] || { lat: -17.82, lng: 31.05 };
      const latitude = baseCoords.lat + (Math.random() * 0.005 - 0.0025);
      const longitude = baseCoords.lng + (Math.random() * 0.005 - 0.0025);
      // Random logo placeholder with category text or color logic if we were fancy, but sticking to random pics
      const logoUrl =
        'https://via.placeholder.com/100?text=' + company.charAt(0);

      // Assign mall id in round-robin from seeded malls
      const assignedMallId = mallIds.length
        ? mallIds[i % mallIds.length]
        : null;

      const bizRes = await pool.query(
        `INSERT INTO businesses (owner_id, name, description, category, subcategory, location, website, phone_number, email, employee_count, is_verified, is_active, latitude, longitude, logo_url, mall_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
        [
          ownerId,
          businessName,
          description,
          category,
          company, // subcategory
          location,
          `www.${company.toLowerCase().replace(/ /g, '')}.co.zw`, // website
          '+263 77 123 4567', // phone
          email, // business email same as login for simplicity or specific
          '50 - 200 Employees', // employee count
          true,
          true,
          latitude,
          longitude,
          logoUrl,
          assignedMallId,
        ]
      );
      createdBusinesses.push({
        id: bizRes.rows[0].id,
        category: category,
        subcategory: company,
      });
    }

    // 4. Create Products
    console.log(' Adding Products...');

    for (const biz of createdBusinesses) {
      // Get products relevant to this business category or subcategory; fallback to any available pool
      const pools = Object.values(productsPool || {});
      const randomFallback = pools.length
        ? pools[Math.floor(Math.random() * pools.length)]
        : [];
      const catalog =
        productsPool[biz.category] ||
        productsPool[biz.subcategory] ||
        randomFallback;

      // Pick 5-8 random products from catalog
      const shuffled = catalog.sort(() => 0.5 - Math.random());
      const selectedCount = Math.floor(Math.random() * 4) + 5;
      const selectedProducts = shuffled.slice(0, selectedCount);

      for (const prod of selectedProducts) {
        let finalPrice = (prod.price * (0.9 + Math.random() * 0.2)).toFixed(2); // +/- 10%

        // Random Promo & Rating Logic
        const types = ['Deal', 'Promo', 'Discount', null];
        const promoType = types[Math.floor(Math.random() * types.length)];
        let discount = 0;
        if (promoType === 'Discount') {
          const discs = [10, 15, 20, 25, 30, 50];
          discount = discs[Math.floor(Math.random() * discs.length)];
        }
        const rating = (3.5 + Math.random() * 1.5).toFixed(1); // 3.5 to 5.0
        const reviews = Math.floor(Math.random() * 100);

        await pool.query(
          `INSERT INTO products (business_id, name, description, price, category, average_rating, review_count, image_url, promotion_type, discount_percent)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            biz.id,
            prod.name,
            `Great ${prod.name} available now!`,
            finalPrice,
            prod.category,
            rating,
            reviews,
            prod.image,
            promoType,
            discount,
          ]
        );
      }
    }

    console.log(' Seed filled with categorized data!');
    // Cleanup orphaned users (users with no business)
    await pool.query(
      "DELETE FROM users WHERE role = 'business' AND id NOT IN (SELECT owner_id FROM businesses)"
    );
    process.exit(0);
  } catch (err) {
    console.error(' User Seed Failed:', err);
    process.exit(1);
  }
}

seed();
