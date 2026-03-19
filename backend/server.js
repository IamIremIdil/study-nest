// ← Entry point. Creates the Express app.
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDB } = require('./db');
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const timerRoutes = require('./routes/timer');
const moodRoutes = require('./routes/mood');
const goalsRoutes = require('./routes/goals');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Initialize database
initDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/timer', timerRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/goals', goalsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '🌸 StudyNest server is running!' });
});

app.listen(PORT, () => {
  console.log(`🌸 StudyNest backend running on http://localhost:${PORT}`);
});