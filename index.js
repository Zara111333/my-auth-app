// Very basic backend
const express = require('express');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const app = express();
const PORT = 3001;

app.use(express.json());

let users = []; // Memory only (resets if you restart)
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // put this in .env
  ssl: { rejectUnauthorized: false }
});

app.post('/api/signup', (req, res) => {
  const { email, password, role } = req.body;
  try {
  const result = await pool.query(
    'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *',
    [email, password, role]
  );

  console.log('New user:', result.rows[0]);
  res.status(201).json({ message: 'User created!' });
} catch (err) {
  console.error('Signup error:', err);
  res.status(500).json({ error: 'Something went wrong' });
}
 });

  users.push({ email, password, role });
  res.status(201).json({ message: 'User created!', user: { email, role } });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  res.json({ message: 'Welcome back!', user: { email, role: user.role } });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
