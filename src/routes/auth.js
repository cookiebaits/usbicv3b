// src/routes/auth.js
const { ADMIN_USER, ADMIN_PASS } = require('../../config/config');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    // create session, etc.
    return res.json({ success: true });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});
