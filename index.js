const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Signup route
app.post('/api/signup', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *',
      [email, password, role]
    );
    res.status(201).json({ message: 'User created!', user: result.rows[0] });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );
    if (result.rows.length > 0) {
      res.status(200).json({ message: 'Login successful!' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profile', async (req, res) => {
  const { user_id, skills, interests, city } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO profiles (user_id, skills, interests, city) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, skills, interests, city]
    );

    res.status(201).json({ message: 'Profile created!', profile: result.rows[0] });
  } catch (err) {
    console.error('Profile creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('✅ Deployed code is working!');
});

// MATCHING ENDPOINT
app.get('/api/match/:id', async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    const userProfile = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [userId]
    );

    if (userProfile.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const { skills, interests, city } = userProfile.rows[0];

    const matches = await pool.query(
      `SELECT * FROM profiles
       WHERE user_id != $1
       AND city = $2
       AND (
         skills && $3::text[] OR
         interests && $4::text[]
       )`,
      [userId, city, skills, interests]
    );

    res.json({ matches: matches.rows });
  } catch (err) {
    console.error('Match error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
