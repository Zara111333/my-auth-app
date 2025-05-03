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
    const { rows: userResult } = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [userId]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const user = userResult[0];
    const { skills: userSkills, interests: userInterests, city: userCity } = user;

    const { rows: candidates } = await pool.query(
      'SELECT * FROM profiles WHERE user_id != $1',
      [userId]
    );

    const matches = candidates.map((candidate) => {
      const sharedSkills = candidate.skills.filter(skill => userSkills.includes(skill));
      const sharedInterests = candidate.interests.filter(interest => userInterests.includes(interest));

      let score = 0;
      score += sharedSkills.length * 1;
      score += sharedInterests.length * 2;
      if (candidate.city === userCity) score += 1;

      return {
        ...candidate,
        match_score: score,
        sharedSkills,
        sharedInterests
      };
    }).filter(match => match.match_score > 0)
      .sort((a, b) => b.match_score - a.match_score);

    res.json({ matches });
  } catch (err) {
    console.error('Match scoring error:', err);
    res.status(500).json({ error: 'Match scoring failed' });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
