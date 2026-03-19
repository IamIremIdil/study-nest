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

app.use(cors());
app.use(express.json());

// Serve frontend folder — fixes the file:// CORS issue
app.use(express.static(path.join(__dirname, '../frontend')));

initDB();

app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/timer', timerRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/goals', goalsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '🌸 StudyNest server is running!' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`🌸 StudyNest running at http://localhost:${PORT}`);
});