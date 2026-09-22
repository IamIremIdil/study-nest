const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { initDB } = require('./db');
const helmet = require('helmet');
app.use(helmet()); // Add security headers to all responses

const rateLimit = require('express-rate-limit');
// Apply rate limiting to all requests
app.use('/api/auth', rateLimit({windowMs: 15 * 60 * 1000, max: 20, message: 'Too many requests from this IP, please try again later.'}));

const authRoutes    = require('./routes/auth');
const notesRoutes   = require('./routes/notes');
const timerRoutes   = require('./routes/timer');
const moodRoutes    = require('./routes/mood');
const goalsRoutes   = require('./routes/goals');
const friendsRoutes = require('./routes/friends');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({origin: 'http://localhost:3001'})); // Allow requests from frontend
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth',    authRoutes);
app.use('/api/notes',   notesRoutes);
app.use('/api/timer',   timerRoutes);
app.use('/api/mood',    moodRoutes);
app.use('/api/goals',   goalsRoutes);
app.use('/api/friends', friendsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '🌸 StudyNest server is running!' });
});

// catch-all MUST be last
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

(async () => {
  await initDB();
app.listen(PORT, () => {
  console.log(`🌸 StudyNest running at http://localhost:${PORT}`);
});
})();