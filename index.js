const express = require('express');
const { Pool } = require('pg');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Hugging Face similarity scoring function
async function getSimilarityScore(text1, text2) {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/sentence-transformers/paraphrase-MiniLM-L6-v2',
      {
        inputs: {
          source_sentence: text1,
          sentences: [text2]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`
        }
      }
    );
    return response.data[0]; // returns a number between 0–1
  } catch (error) {
    console.error('Hugging Face API error:', error.response?.data || error.message);
    return 0;
  }
}

// ✅ Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());

// ✅ Signup
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

// ✅ Login
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

// ✅ Create profile
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

// ✅ AI Match route
app.get('/api/match/ai/:id', async (req, res) => {
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
    const { rows: candidates } = await pool.query(
      'SELECT * FROM profiles WHERE user_id != $1',
      [userId]
    );

    const matches = [];

    for (const candidate of candidates) {
      const skillText = `Skills: ${user.skills.join(', ')}`
      const interestText = `Interests: ${user.interests.join(', ')}`

      const candidateSkillText = `Skills: ${candidate.skills.join(', ')}`
      const candidateInterestText = `Interests: ${candidate.interests.join(', ')}`

      const skillScore = await getSimilarityScore(skillText, candidateSkillText);
      const interestScore = await getSimilarityScore(interestText, candidateInterestText);
      const cityScore = user.city === candidate.city ? 1 : 0;

      const matchScore = (skillScore + interestScore + cityScore) / 3;

      matches.push({
        user_id: candidate.user_id,
        match_score: matchScore.toFixed(2),
        shared_city: cityScore === 1,
      });
    }

    matches.sort((a, b) => b.match_score - a.match_score);

    res.json({ matches });
  } catch (err) {
    console.error('AI match error:', err);
    res.status(500).json({ error: 'AI matching failed' });
  }
});

// ✅ Home route
app.get('/', (req, res) => {
  res.send('✅ Deployed code is working!');
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
