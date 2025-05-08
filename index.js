import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.get('/', (req, res) => {
  res.send('Server is up and running!');
});

app.post('/api/profile', async (req, res) => {
  try {
    const { user_id, interests, skills, location } = req.body;

    const { data, error } = await supabase
      .from('profiles')
      .insert([{ user_id, interests, skills, location }]);

    if (error) {
      console.error('Error inserting profile:', error.message);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Profile creation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
