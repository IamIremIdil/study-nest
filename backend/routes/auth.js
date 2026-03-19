// ← Register & Login
// routes/auth.js — Register & Login endpoints
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { run, get } = require('../db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
// Creates a new user account
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  // Check if username is taken
  const existing = get('SELECT id FROM users WHERE username = ?', [username]);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken. Try another!' });
  }

  // Hash password — NEVER store plain text passwords!
  const password_hash = await bcrypt.hash(password, 12);
  const validRole = ['student', 'supporter'].includes(role) ? role : 'student';

  const userId = run(
    'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
    [username, password_hash, validRole]
  );

  const token = jwt.sign({ id: userId, username, role: validRole }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    message: '🌸 Welcome to StudyNest!',
    token,
    user: { id: userId, username, role: validRole }
  });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = get('SELECT * FROM users WHERE username = ?', [username]);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    message: `🌸 Welcome back, ${user.username}!`,
    token,
    user: { id: user.id, username: user.username, role: user.role }
  });
});

// GET /api/auth/me — Get current user info (protected)
router.get('/me', authenticate, (req, res) => {
  const user = get('SELECT id, username, role, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user });
});

// GET /api/auth/users — List all users (to find partner's ID for notes)
router.get('/users', authenticate, (req, res) => {
  const users = require('../db').all(
    'SELECT id, username, role FROM users WHERE id != ?',
    [req.user.id]
  );
  res.json({ users });
});

module.exports = router;