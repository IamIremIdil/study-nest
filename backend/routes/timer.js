// ← Pomodoro sessions
// routes/timer.js — Pomodoro session tracking
const express = require('express');
const { run, all, get } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// POST /api/timer/start — Log a new pomodoro session
router.post('/start', (req, res) => {
  const { duration_minutes = 25, subject } = req.body;

  const id = run(
    'INSERT INTO pomodoro_sessions (user_id, duration_minutes, subject) VALUES (?, ?, ?)',
    [req.user.id, duration_minutes, subject || null]
  );

  res.status(201).json({
    message: '🍅 Pomodoro started! You got this!',
    session: { id, duration_minutes, subject, started_at: new Date().toISOString() }
  });
});

// PATCH /api/timer/:id/complete — Mark a session as completed
router.patch('/:id/complete', (req, res) => {
  const session = get('SELECT * FROM pomodoro_sessions WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]);

  if (!session) return res.status(404).json({ error: 'Session not found.' });

  run('UPDATE pomodoro_sessions SET completed = 1 WHERE id = ?', [req.params.id]);
  res.json({ message: '🎉 Session complete! Great work!' });
});

// GET /api/timer/stats — Get study stats for current user
router.get('/stats', (req, res) => {
  const rows = all(`
    SELECT
      COUNT(*) as total_sessions,
      SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_sessions,
      SUM(CASE WHEN completed = 1 THEN duration_minutes ELSE 0 END) as total_minutes,
      subject
    FROM pomodoro_sessions
    WHERE user_id = ?
    GROUP BY subject
    ORDER BY total_minutes DESC
  `, [req.user.id]);

  const overall = get(`
    SELECT
      COUNT(*) as total_sessions,
      SUM(CASE WHEN completed = 1 THEN duration_minutes ELSE 0 END) as total_minutes
    FROM pomodoro_sessions WHERE user_id = ? AND completed = 1
  `, [req.user.id]);

  res.json({
    by_subject: rows,
    overall: {
      completed_sessions: overall?.total_sessions || 0,
      total_hours: Math.round((overall?.total_minutes || 0) / 60 * 10) / 10
    }
  });
});

// GET /api/timer/sessions — Get recent sessions
router.get('/sessions', (req, res) => {
  const sessions = all(`
    SELECT * FROM pomodoro_sessions
    WHERE user_id = ?
    ORDER BY started_at DESC
    LIMIT 20
  `, [req.user.id]);

  res.json({ sessions });
});

module.exports = router;