// ← Love notes
// routes/notes.js — Love notes between partners
const express = require('express');
const { run, all } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require login
router.use(authenticate);

// POST /api/notes — Send a love note
router.post('/', (req, res) => {
  const { to_user_id, message, emoji } = req.body;

  if (!to_user_id || !message) {
    return res.status(400).json({ error: 'Recipient and message are required.' });
  }

  if (message.length > 500) {
    return res.status(400).json({ error: 'Message too long (max 500 chars).' });
  }

  const id = run(
    'INSERT INTO love_notes (from_user_id, to_user_id, message, emoji) VALUES (?, ?, ?, ?)',
    [req.user.id, to_user_id, message, emoji || '🌸']
  );

  res.status(201).json({
    message: '💌 Note sent!',
    note: { id, from_user_id: req.user.id, to_user_id, message, emoji }
  });
});

// GET /api/notes/inbox — Get notes sent TO me
router.get('/inbox', (req, res) => {
  const notes = all(`
    SELECT n.*, u.username as from_username
    FROM love_notes n
    JOIN users u ON n.from_user_id = u.id
    WHERE n.to_user_id = ?
    ORDER BY n.created_at DESC
  `, [req.user.id]);

  res.json({ notes });
});

// GET /api/notes/sent — Get notes I sent
router.get('/sent', (req, res) => {
  const notes = all(`
    SELECT n.*, u.username as to_username
    FROM love_notes n
    JOIN users u ON n.to_user_id = u.id
    WHERE n.from_user_id = ?
    ORDER BY n.created_at DESC
  `, [req.user.id]);

  res.json({ notes });
});

// DELETE /api/notes/:id — Delete a note (only sender can delete)
router.delete('/:id', (req, res) => {
  const note = require('../db').get(
    'SELECT * FROM love_notes WHERE id = ?', [req.params.id]
  );

  if (!note) return res.status(404).json({ error: 'Note not found.' });
  if (note.from_user_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only delete your own notes.' });
  }

  run('DELETE FROM love_notes WHERE id = ?', [req.params.id]);
  res.json({ message: '🗑️ Note deleted.' });
});

module.exports = router;