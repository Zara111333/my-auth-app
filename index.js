import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
app.use(express.json());
const cors = require('cors');
app.use(cors());


dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.get('/api/profile/:id', (req, res) => {
  const userId = req.params.id;

  // Replace this with actual logic later
  const mockProfile = {
    id: userId,
    name: 'John Doe',
    city: 'Amsterdam',
    interests: ['painting', 'drawing'],
    skills: ['animation', 'graphic']
  };

  res.json(mockProfile);
});

// CORS config – allow your deployed frontend
const allowedOrigins = [
  'http://localhost:5173',
  'https://cryptess-frontend.onrender.com',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Supabase setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Health check
app.get('/', (req, res) => {
  res.send('API is live 🚀');
});

// Create or update user profile
app.post('/api/profile/:id', async (req, res) => {
  const userId = req.params.id;
  const { interests, skills, location } = req.body;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert([
        {
          user_id: userId,
          interests,
          skills,
          location
        }
      ]);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json({ message: 'Profile saved successfully', data });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});
