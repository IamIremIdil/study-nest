// ← Exam goals & countdowns
// routes/goals.js — Exam goals & countdown tracker
const express = require('express');
const { run, all, get } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// POST /api/goals — Create a new goal/exam
router.post('/', (req, res) => {
  const { title, description, target_date } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Goal title is required.' });
  }

  const id = run(
    'INSERT INTO goals (user_id, title, description, target_date) VALUES (?, ?, ?, ?)',
    [req.user.id, title, description || null, target_date || null]
  );

  res.status(201).json({
    message: '🎯 Goal added! You can do it!',
    goal: { id, title, description, target_date }
  });
});

// GET /api/goals — Get all goals with countdown
router.get('/', (req, res) => {
  const goals = all(`
    SELECT * FROM goals
    WHERE user_id = ?
    ORDER BY target_date ASC, created_at ASC
  `, [req.user.id]);

  // Add days_remaining to each goal
  const now = new Date();
  const goalsWithCountdown = goals.map(goal => {
    let days_remaining = null;
    if (goal.target_date) {
      const target = new Date(goal.target_date);
      const diff = target - now;
      days_remaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    return { ...goal, days_remaining };
  });

  res.json({ goals: goalsWithCountdown });
});

// PATCH /api/goals/:id/complete — Mark goal as completed
router.patch('/:id/complete', (req, res) => {
  const goal = get('SELECT * FROM goals WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]);

  if (!goal) return res.status(404).json({ error: 'Goal not found.' });

  run('UPDATE goals SET completed = 1 WHERE id = ?', [req.params.id]);
  res.json({ message: '🎊 Congratulations! Goal achieved!' });
});

// PATCH /api/goals/:id — Update a goal
router.patch('/:id', (req, res) => {
  const { title, description, target_date } = req.body;
  const goal = get('SELECT * FROM goals WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]);

  if (!goal) return res.status(404).json({ error: 'Goal not found.' });

  run(
    'UPDATE goals SET title = ?, description = ?, target_date = ? WHERE id = ?',
    [title || goal.title, description ?? goal.description, target_date ?? goal.target_date, req.params.id]
  );

  res.json({ message: '✏️ Goal updated!' });
});

// DELETE /api/goals/:id
router.delete('/:id', (req, res) => {
  const goal = get('SELECT * FROM goals WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]);

  if (!goal) return res.status(404).json({ error: 'Goal not found.' });

  run('DELETE FROM goals WHERE id = ?', [req.params.id]);
  res.json({ message: '🗑️ Goal removed.' });
});

module.exports = router;