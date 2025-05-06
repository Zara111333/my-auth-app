import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// 👇 Enable CORS for your frontend
app.use(
  cors({
    origin: ['http://localhost:5173', 'https://my-auth-app-qdbi.onrender.com'],
    methods: ['GET', 'POST'],
    credentials: true,
  })
);

// 👇 Required to parse JSON request bodies
app.use(express.json());

// 👇 Dummy route to confirm backend is alive
app.get('/', (req, res) => {
  res.send('Backend is live!');
});

// 👇 Your profile creation endpoint (adjust logic as needed)
app.post('/api/profile', (req, res) => {
  const { user_id, skills, interests, city } = req.body;

  if (!user_id || !skills || !interests || !city) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  console.log('Profile received:', { user_id, skills, interests, city });

  res.status(201).json({ message: 'Profile created successfully' });
});

// 👇 Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
