import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import aiMatch from './utils.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;



// 🔁 Replace this with your actual frontend URL from Render
const allowedOrigins = [
  'http://localhost:5173',
  'https://cryptess-frontend.onrender.com'  // ✅ Add your real Render frontend URL here
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

app.use(express.json());

app.post('/api/profile/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { interests, skills, location } = req.body;

    // You can add logic here to save the profile in your DB
    console.log(`Profile for ${userId}:`, { interests, skills, location });

    res.status(200).json({ message: 'Profile created successfully' });
  } catch (error) {
    console.error('Profile creation failed:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/', (req, res) => {
  res.send('Cryptess backend is running.');
});

app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});
