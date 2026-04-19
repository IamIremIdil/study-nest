const express = require('express');
const router = express.Router();
const { run, all, get } = require('../db');
const { authenticate } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'studynest_secret';
router.use(authenticate);

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

// Send friend request
router.post('/request', auth, (req, res) => {
  const { username } = req.body;
  const target = get('SELECT id FROM users WHERE username = ?', [username]);
  if (!target) return res.json({ error: 'User not found' });
  const existing = get('SELECT id FROM friend_requests WHERE from_user_id = ? AND to_user_id = ?', [req.user.id, target.id]);
  if (existing) return res.json({ error: 'Request already sent' });
  run('INSERT INTO friend_requests (from_user_id, to_user_id) VALUES (?, ?)', [req.user.id, target.id]);
  res.json({ message: '🌸 Friend request sent!' });
});

// Get incoming requests
router.get('/requests', auth, (req, res) => {
  const requests = all(`
    SELECT fr.id, u.username as from_username 
    FROM friend_requests fr JOIN users u ON fr.from_user_id = u.id
    WHERE fr.to_user_id = ? AND fr.request_status = 'pending'`, [req.user.id]);
  res.json({ requests });
});

// Accept or reject
router.patch('/requests/:id/:action', auth, (req, res) => {
  const { id, action } = req.params;
  const status = action === 'accept' ? 'accepted' : 'rejected';
  run('UPDATE friend_requests SET request_status = ? WHERE id = ?', [status, id]);
  res.json({ message: action === 'accept' ? '🌸 Friend added!' : 'Request declined.' });
});

// Get friends list
router.get('/', auth, (req, res) => {
  const friends = all(`
    SELECT u.id, u.username, u.role FROM friend_requests fr
    JOIN users u ON (fr.from_user_id = u.id OR fr.to_user_id = u.id)
    WHERE (fr.from_user_id = ? OR fr.to_user_id = ?) 
      AND fr.request_status = 'accepted' AND u.id != ?`,
    [req.user.id, req.user.id, req.user.id]);
  res.json({ friends });
});


router.delete('/:id', auth, (req, res) => {
  run(`DELETE FROM friend_requests WHERE 
    (from_user_id = ? AND to_user_id = ?) OR 
    (from_user_id = ? AND to_user_id = ?)`,
    [req.user.id, req.params.id, req.params.id, req.user.id]);
  res.json({ message: 'Friend removed.' });
});

module.exports = router;