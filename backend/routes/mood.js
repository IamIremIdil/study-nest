// ← Mood check-ins
// routes/mood.js — Mood & energy check-ins
const express = require('express');
const { run, all, get } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// POST /api/mood — Log a mood entry
router.post('/', (req, res) => {
  const { mood, energy, note } = req.body;

  if (!mood || !energy) {
    return res.status(400).json({ error: 'Mood and energy scores are required.' });
  }
  if (mood < 1 || mood > 5 || energy < 1 || energy > 5) {
    return res.status(400).json({ error: 'Scores must be between 1 and 5.' });
  }

  const id = run(
    'INSERT INTO mood_entries (user_id, mood, energy, note) VALUES (?, ?, ?, ?)',
    [req.user.id, mood, energy, note || null]
  );

  const encouragements = [
    "You're doing amazing 🌸",
    "Every study session counts 🌿",
    "Your future self will thank you 💛",
    "One step at a time 🍵",
    "You've got this, love! ✨"
  ];

  const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

  res.status(201).json({
    message: encouragement,
    entry: { id, mood, energy, note }
  });
});

// GET /api/mood/history — Get mood history
router.get('/history', (req, res) => {
  const entries = all(`
    SELECT * FROM mood_entries
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 30
  `, [req.user.id]);

  res.json({ entries });
});

// GET /api/mood/summary — Get mood averages
router.get('/summary', (req, res) => {
  const summary = get(`
    SELECT
      ROUND(AVG(mood), 1) as avg_mood,
      ROUND(AVG(energy), 1) as avg_energy,
      COUNT(*) as total_entries
    FROM mood_entries
    WHERE user_id = ?
  `, [req.user.id]);

  res.json({ summary });
});

module.exports = router;