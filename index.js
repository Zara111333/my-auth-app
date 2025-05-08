import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// ✅ CORS config to allow your frontend
app.use(
  cors({
    origin: 'https://cryptess-frontend.onrender.com',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);

app.use(express.json());

// ✅ Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// 🔥 Route to create user profile
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

// 🤖 Route to get top matches for a user
app.get('/api/match/ai/:id', async (req, res) => {
  const userId = Number(req.params.id);

  if (!userId) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const { data: currentUserProfile, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (userError || !currentUserProfile) {
    return res.status(404).json({ error: 'User profile not found' });
  }

  const { data: allProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .neq('user_id', userId);

  if (profilesError) {
    return res.status(500).json({ error: 'Error fetching profiles' });
  }

  const similarityScores = allProfiles.map(profile => {
    const sharedSkills = profile.skills.filter(skill =>
      currentUserProfile.skills.includes(skill)
    );
    const sharedInterests = profile.interests.filter(interest =>
      currentUserProfile.interests.includes(interest)
    );
    const cityMatch = profile.city === currentUserProfile.city ? 1 : 0;

    const score =
      sharedSkills.length * 2 +
      sharedInterests.length +
      cityMatch * 3;

    return { profile, score };
  });

  similarityScores.sort((a, b) => b.score - a.score);
  const topMatches = similarityScores.slice(0, 3).map(match => match.profile);

  res.json({ matches: topMatches });
});

// 🟢 Health check
app.get('/', (req, res) => {
  res.send('🚀 Cryptess API is running');
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
