// src/routes/auth.js
const express = require('express');
const router = express.Router();
const { ADMIN_USER, ADMIN_PASS } = require('../../config/config');

// ----------  Existing code may only have a GET route ----------
router.get('/login', (req, res) => {
  // Usually this just returns the login page – not what the SPA needs.
  res.status(405).json({ error: 'Use POST' });
});

// ----------  Add / ensure a POST route ----------
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    // In a real app you’d issue a signed cookie / JWT here.
    req.session && (req.session.isAdmin = true);
    return res.json({ success: true, message: 'Logged in' });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

module.exports = router;
