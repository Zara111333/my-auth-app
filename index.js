const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3001;
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


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

    const systemPrompt = `
You are a matchmaking assistant for a volunteering platform.
Your job is to analyze how well volunteer profiles match the interests and skills of this main user.

MAIN USER:
City: ${user.city}
Skills: ${user.skills.join(', ')}
Interests: ${user.interests.join(', ')}

Here are the CANDIDATES:
${candidates.map((c, i) => `
Candidate ${i + 1}:
User ID: ${c.user_id}
City: ${c.city}
Skills: ${c.skills.join(', ')}
Interests: ${c.interests.join(', ')}
`).join('\n')}

Based on skills, interests, and city, rank the top 3 best matching candidates with a score from 1 to 10 and explain why.
Return JSON with: user_id, score, and reason.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      temperature: 0.7
    });

    const text = completion.choices[0].message.content;

    res.send({ ai_matches: text });
  } catch (err) {
    console.error('AI match error:', err.response?.data || err.message || err);
    res.status(500).json({ error: 'AI matching failed' });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
