const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Profile route
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

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
