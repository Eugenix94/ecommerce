// Clean implementation starts here
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';
dotenv.config();
import dotenv from 'dotenv';
dotenv.config();

// Validate required environment variables for Render
const requiredEnv = [
  'PORT',
  'PGUSER',
  'PGDATABASE',
  'PGPASSWORD',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
  'SESSION_SECRET'
];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  database: process.env.PGDATABASE || 'ecommerce',
  password: process.env.PGPASSWORD || 'dogfood',
  port: Number(process.env.PGPORT || 5432)
});

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
// Serve static files (SVG images) in production
import path from 'path';
app.use('/images', express.static(path.join(process.cwd(), '../public/images')));
// Health check endpoint for Render
app.get('/healthz', (_req, res) => res.send('ok'));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));
app.use(passport.initialize());
app.use(passport.session());

// Minimal typed helpers
type UserRow = { id: number; username: string; email: string; password: string | null };

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: number, done) => {
  try {
    const r = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [id]);
    done(null, r.rows[0]);
  } catch (e) { done(e); }
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'GOOGLE_CLIENT_ID',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'GOOGLE_CLIENT_SECRET',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback'
}, async (_a, _r, profile, done) => {
  try {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value || '';
    const username = profile.displayName || email || ('user_' + googleId.slice(0,6));
    let u = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    let user = u.rows[0];
    if (!user) {
      u = await pool.query('INSERT INTO users (username, email, google_id, provider) VALUES ($1,$2,$3,$4) RETURNING *', [username, email, googleId, 'google']);
      user = u.rows[0];
    }
    done(null, user);
  } catch (e) { done(e as any); }
}));

// Simple: fixed images per product (served from frontend public/images). No dynamic logic.
const PRODUCT_IMAGE_MAP: Record<string,string> = {
  'Sony WH-1000XM5 Wireless Headphones': '/images/headphones.svg',
  'Apple Watch Series 9': '/images/watch.svg',
  'Keurig K-Classic Coffee Maker': '/images/coffee-maker.svg',
  'Manduka PRO Yoga Mat': '/images/yoga-mat.svg',
  'JBL Flip 6 Bluetooth Speaker': '/images/speaker.svg',
  'Eco-Friendly Water Bottle': '/images/bottle.svg',
  'Standing Desk': '/images/desk.svg',
  'Nike Air Zoom Pegasus 40 Running Shoes': '/images/shoes.svg'
};
const DEFAULT_PRODUCT_IMAGE = '/images/product.svg';
function imageForProductName(name: string) {
  return PRODUCT_IMAGE_MAP[name] || DEFAULT_PRODUCT_IMAGE;
}

async function setupDatabase() {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    google_id TEXT,
    provider TEXT DEFAULT 'local'
  );`);
  await pool.query(`CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image TEXT,
    category TEXT,
    stock INTEGER DEFAULT 0
  );`);
  await pool.query(`CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total REAL NOT NULL,
    payment_status TEXT,
    delivery_status TEXT,
    address TEXT,
    payment_method TEXT,
    delivery_method TEXT,
    deleted BOOLEAN DEFAULT FALSE
  );`);
  await pool.query(`CREATE TABLE IF NOT EXISTS order_products (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    deleted BOOLEAN DEFAULT FALSE
  );`);
}

async function seedProducts() {
  const products = [
    { name: 'Sony WH-1000XM5 Wireless Headphones', description: 'Noise-cancelling over-ear headphones with 30h battery life.', price: 99.99, category: 'Electronics', stock: 50 },
    { name: 'Apple Watch Series 9', description: 'Fitness tracking, heart rate monitor, notifications.', price: 149.99, category: 'Electronics', stock: 30 },
    { name: 'Keurig K-Classic Coffee Maker', description: 'Programmable drip coffee maker.', price: 59.99, category: 'Home Appliances', stock: 20 },
    { name: 'Manduka PRO Yoga Mat', description: 'Eco-friendly yoga mat.', price: 24.99, category: 'Fitness', stock: 100 },
    { name: 'JBL Flip 6 Bluetooth Speaker', description: 'Portable speaker with deep bass.', price: 39.99, category: 'Electronics', stock: 40 },
    { name: 'Eco-Friendly Water Bottle', description: 'Reusable stainless steel bottle.', price: 19.99, category: 'Fitness', stock: 80 },
    { name: 'Standing Desk', description: 'Adjustable height desk.', price: 299.99, category: 'Furniture', stock: 15 },
    { name: 'Nike Air Zoom Pegasus 40 Running Shoes', description: 'Lightweight running shoes.', price: 79.99, category: 'Footwear', stock: 60 }
  ];
  for (const p of products) {
    const existing = await pool.query('SELECT id FROM products WHERE name = $1', [p.name]);
    const image = imageForProductName(p.name);
    if (existing.rows.length === 0) {
      await pool.query('INSERT INTO products (name, description, price, image, category, stock) VALUES ($1,$2,$3,$4,$5,$6)', [p.name, p.description, p.price, image, p.category, p.stock]);
    } else {
      await pool.query('UPDATE products SET description=$2, price=$3, image=$4, category=$5, stock=$6 WHERE name=$1', [p.name, p.description, p.price, image, p.category, p.stock]);
    }
  }
}

// Auth & user routes
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, email, password) VALUES ($1,$2,$3)', [username, email, hash]);
    res.status(201).json({ message: 'Registered' });
  } catch (e: any) {
    if (e.code === '23505') return res.status(409).json({ error: 'Username or email exists' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username & password required' });
  try {
    const r = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
    if (!r.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user: UserRow = r.rows[0];
    if (!user.password) return res.status(401).json({ error: 'Account uses OAuth' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ message: 'Login ok', user: { id: user.id, username: user.username, email: user.email } });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Product routes
app.get('/api/products', async (_req, res) => {
  const r = await pool.query('SELECT * FROM products ORDER BY id');
  res.json(r.rows);
});

app.post('/api/products', async (req, res) => {
  const { name, description, price, category, stock } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'Name & price required' });
  try {
  const image = imageForProductName(name);
    const r = await pool.query('INSERT INTO products (name, description, price, image, category, stock) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [name, description, price, image, category, stock || 0]);
    res.status(201).json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Create failed' }); }
});

app.get('/api/products/:id', async (req, res) => {
  const r = await pool.query('SELECT * FROM products WHERE id=$1', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
});

app.put('/api/products/:id', async (req, res) => {
  const { name, description, price, category, stock } = req.body;
  try {
  const image = imageForProductName(name);
  const r = await pool.query('UPDATE products SET name=$1, description=$2, price=$3, image=$4, category=$5, stock=$6 WHERE id=$7 RETURNING *', [name, description, price, image, category, stock, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Update failed' }); }
});

app.delete('/api/products/:id', async (req, res) => {
  const r = await pool.query('DELETE FROM products WHERE id=$1 RETURNING id', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

// User profile adjustments
app.put('/api/users/username', async (req, res) => {
  const { oldUsername, newUsername } = req.body;
  if (!oldUsername || !newUsername) return res.status(400).json({ error: 'Both usernames required' });
  try {
    const r = await pool.query('UPDATE users SET username=$1 WHERE username=$2', [newUsername, oldUsername]);
    if (!r.rowCount) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Updated' });
  } catch (e: any) {
    if (e.code === '23505') return res.status(409).json({ error: 'Username exists' });
    res.status(500).json({ error: 'Update failed' });
  }
});

app.put('/api/users/password', async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  if (!username || !oldPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' });
  try {
    const r = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
    if (!r.rows.length) return res.status(404).json({ error: 'User not found' });
    const user: UserRow = r.rows[0];
    if (!user.password) return res.status(400).json({ error: 'OAuth account' });
    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) return res.status(401).json({ error: 'Old password wrong' });
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password=$1 WHERE id=$2', [hash, user.id]);
    res.json({ message: 'Password updated' });
  } catch { res.status(500).json({ error: 'Update failed' }); }
});

app.post('/api/users/delete', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  const r = await pool.query('DELETE FROM users WHERE username=$1 RETURNING id', [username]);
  if (!r.rows.length) return res.status(404).json({ error: 'User not found' });
  res.json({ message: 'Deleted' });
});

// Orders
app.post('/api/checkout', async (req, res) => {
  const { userId, items, address, paymentMethod, deliveryMethod } = req.body;
  if (!userId || !Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Missing fields' });
  try {
    const total = items.reduce((s: number, it: any) => s + (it.price * it.qty), 0);
    const pay = 'paid';
    const del = 'processing';
    const o = await pool.query('INSERT INTO orders (user_id,total,payment_status,delivery_status,address,payment_method,delivery_method) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at', [userId, total, pay, del, address, paymentMethod, deliveryMethod]);
    const orderId = o.rows[0].id;
    for (const it of items) {
      await pool.query('INSERT INTO order_products (order_id, product_id, quantity, price) VALUES ($1,$2,$3,$4)', [orderId, it.id, it.qty, it.price]);
    }
    res.status(201).json({ orderId, total, paymentStatus: pay, deliveryStatus: del });
  } catch { res.status(500).json({ error: 'Checkout failed' }); }
});

app.delete('/api/orders/:orderId', async (req, res) => {
  const { orderId } = req.params;
  // Soft delete: mark deleted flags
  await pool.query('UPDATE order_products SET deleted=TRUE WHERE order_id=$1', [orderId]);
  const r = await pool.query('UPDATE orders SET deleted=TRUE WHERE id=$1 RETURNING id', [orderId]);
  if (!r.rows.length) return res.status(404).json({ error: 'Order not found' });
  res.json({ message: 'Deleted' });
});

app.get('/api/orders/:userId', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM orders WHERE user_id=$1 AND deleted=FALSE ORDER BY created_at DESC', [req.params.userId]);
    const orders = r.rows;
    for (const o of orders) {
      const it = await pool.query('SELECT * FROM order_products WHERE order_id=$1 AND deleted=FALSE', [o.id]);
      o.items = it.rows;
    }
    res.json(orders);
  } catch { res.status(500).json({ error: 'Fetch failed' }); }
});

// OAuth
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile','email'] }));
app.get('/api/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login', session: true }), (_req, res) => {
  res.redirect('http://localhost:5173/?googleLogin=success');
});

app.get('/api/auth/user', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    const u: any = req.user;
    return res.json({ user: { id: u.id, username: u.username, email: u.email } });
  }
  res.status(401).json({ error: 'Not authenticated' });
});

app.post('/api/auth/logout', (req, res) => {
  // @ts-ignore
  req.logout?.((err: any) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    req.session?.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out' });
    });
  });
});

// Boot
(async () => {
  try {
    await setupDatabase();
    await seedProducts();
    const port = Number(process.env.PORT);
    if (!port) throw new Error('PORT env variable must be set (Render requirement)');
    app.listen(port, () => {
      console.log('Backend running at http://localhost:' + port);
    });
  } catch (e) {
    console.error('Startup failed', e);
    process.exit(1);
  }
})();


