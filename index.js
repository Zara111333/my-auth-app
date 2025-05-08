import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(
  cors({
    origin: 'https://cryptess-frontend.onrender.com',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// 🔥 Route to create profile
app.post('/api/profile', async (req, res) => {
  const { user_id, skills, interests, city } = req.body;

  if (!user_id || !skills || !interests || !city) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const { error } = await supabase.from('profiles').insert([
    { user_id, skills, interests, city },
  ]);

  if (error) {
    console.error('❌ Supabase error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json({ message: '✅ Profile created successfully' });
});

// 🟢 Health check or fallback
app.get('/', (req, res) => {
  res.send('🚀 Cryptess API is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
