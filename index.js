const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// SIGNUP
app.post('/api/signup', async (req, res) => {
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

// LOGIN
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
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/api/profile', async (req, res) => {
  const { user_id, skills, interests, city } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO profiles (user_id, skills, interests, city) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, skills, interests, city]
    );

    console.log('New profile created:', result.rows[0]);
    res.status(201).json({ message: 'Profile created!', profile: result.rows[0] });
  } catch (err) {
    console.error('Profile creation error:', err.message); // <<< MAKE SURE THIS PRINTS
    res.status(500).json({ error: err.message }); // <<< SEND BACK the REAL error
  }
});

app.get('/api/match/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);

  try {
    // Get the profile of the user
    const { rows: userProfiles } = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [userId]
    );

    if (userProfiles.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const userProfile = userProfiles[0];

    // Find others who share similar interests
    const { rows: matches } = await pool.query(
      `SELECT * FROM profiles 
       WHERE user_id != $1
       AND (skills && $2::text[] OR interests && $3::text[])`,
      [userId, userProfile.skills, userProfile.interests]
    );

    res.status(200).json({ matches });
  } catch (err) {
    console.error('Matching error:', err);
    res.status(500).json({ error: 'Matchmaking failed' });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
