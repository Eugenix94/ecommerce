import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  database: 'ecommerce',
  password: 'dogfood',
  port: 5432
});

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

async function setupDatabase() {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
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

setupDatabase().catch((err) => {
  console.error('Database setup failed:', err);
  process.exit(1);
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3)', [username, email, hashedPassword]);
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Username or email already exists.' });
    } else {
      res.status(500).json({ error: 'Registration failed.' });
    }
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    const user = userRes.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    res.json({ message: 'Login successful', user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.' });
  }
});

// Product listing endpoint
app.get('/api/products', async (req, res) => {
  const result = await pool.query('SELECT * FROM products');
  res.json(result.rows);
});

// Create product endpoint
app.post('/api/products', async (req, res) => {
  const { name, description, price, image, category, stock } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required.' });
  }
  try {
    const result = await pool.query('INSERT INTO products (name, description, price, image, category, stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [name, description, price, image, category, stock || 0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Product creation failed.' });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product.' });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price, image, category, stock } = req.body;
  try {
    const result = await pool.query('UPDATE products SET name = $1, description = $2, price = $3, image = $4, category = $5, stock = $6 WHERE id = $7 RETURNING *', [name, description, price, image, category, stock, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Product update failed.' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Product deletion failed.' });
  }
});

// Update username endpoint
app.put('/api/users/username', async (req, res) => {
  const { oldUsername, newUsername } = req.body;
  if (!oldUsername || !newUsername) {
    return res.status(400).json({ error: 'Old and new username required.' });
  }
  try {
    const result = await pool.query('UPDATE users SET username = $1 WHERE username = $2', [newUsername, oldUsername]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ message: 'Username updated.' });
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Username already exists.' });
    } else {
      res.status(500).json({ error: 'Username update failed.' });
    }
  }
});

// Update password endpoint
app.put('/api/users/password', async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  if (!username || !oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Username, old password, and new password required.' });
  }
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = userRes.rows[0];
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Old password incorrect.' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE username = $2', [hashedPassword, username]);
    res.json({ message: 'Password updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Password update failed.' });
  }
});

// Delete user endpoint (POST for frontend compatibility)
app.post('/api/users/delete', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username required.' });
  }
  try {
    const result = await pool.query('DELETE FROM users WHERE username = $1', [username]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ message: 'Account deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Account deletion failed.' });
  }
});

// Checkout endpoint: mock payment and delivery
app.post('/api/checkout', async (req, res) => {
  const { userId, items, address, paymentMethod, deliveryMethod } = req.body;
  if (!userId || !Array.isArray(items) || items.length === 0 || !address || !paymentMethod || !deliveryMethod) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  try {
    const paymentStatus = 'paid';
    const deliveryStatus = 'processing';
    const total = items.reduce((sum: number, item: any) => sum + item.price * item.qty, 0);
    const orderRes = await pool.query('INSERT INTO orders (user_id, total, payment_status, delivery_status, address, payment_method, delivery_method) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at', [userId, total, paymentStatus, deliveryStatus, address, paymentMethod, deliveryMethod]);
    const orderId = orderRes.rows[0].id;
    for (const item of items) {
      await pool.query('INSERT INTO order_products (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)', [orderId, item.id, item.qty, item.price]);
    }
    res.status(201).json({ orderId, created_at: orderRes.rows[0].created_at, total, paymentStatus, deliveryStatus });
  } catch (err) {
    res.status(500).json({ error: 'Checkout failed.' });
  }
});

// Delete order endpoint (soft delete)
app.delete('/api/orders/:orderId', async (req, res) => {
  const { orderId } = req.params;
  try {
    await pool.query('UPDATE order_products SET deleted = TRUE WHERE order_id = $1', [orderId]);
    const result = await pool.query('UPDATE orders SET deleted = TRUE WHERE id = $1 RETURNING *', [orderId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    res.json({ message: 'Order deleted.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Order deletion failed.', details: err.message });
  }
});

// Get user orders (with payment/delivery details)
app.get('/api/orders/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const ordersRes = await pool.query('SELECT * FROM orders WHERE user_id = $1 AND deleted = FALSE ORDER BY created_at DESC', [userId]);
    const orders = ordersRes.rows;
    for (const order of orders) {
      const itemsRes = await pool.query('SELECT * FROM order_products WHERE order_id = $1 AND deleted = FALSE', [order.id]);
      order.items = itemsRes.rows;
    }
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch orders.', details: err.message });
  }
});

const port = 3001;
app.listen(port, () => {
  console.log('Backend running at http://localhost:' + port);
});
