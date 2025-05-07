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

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

app.post('/match', async (req, res) => {
  try {
    const input = req.body;
    const result = await aiMatch(input);
    res.json(result);
  } catch (err) {
    console.error('Match error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.send('Cryptess backend is running.');
});

app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});
