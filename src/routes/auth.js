// src/routes/auth.js
import express from 'express';
import * as config from '../../config/config.js';

const router = express.Router();

// In-memory storage for the session
let adminCredentials = {
  username: config.ADMIN_USER,
  password: config.ADMIN_PASS
};

let users = [
  {
    _id: '1',
    fullName: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    status: 'active',
    twoFAEnabled: true,
    lastLogin: new Date().toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    accounts: {
      checking: { balance: 1250.50 },
      savings: { balance: 5000.00 }
    }
  },
  {
    _id: '2',
    fullName: 'Jane Smith',
    username: 'janesmith',
    email: 'jane@example.com',
    status: 'pending',
    twoFAEnabled: false,
    lastLogin: null,
    createdAt: new Date().toISOString(),
    accounts: {
      checking: { balance: 0 },
      savings: { balance: 0 }
    }
  }
];

// Authentication middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    // In this mock, we accept any token that starts with mock-admin-token
    if (token.startsWith('mock-admin-token')) {
      return next();
    }
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Admin Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === adminCredentials.username && password === adminCredentials.password) {
    return res.json({
      success: true,
      message: 'Logged in',
      token: 'mock-admin-token-' + Date.now()
    });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// Admin Settings (includes security)
router.get('/settings', authenticateAdmin, (req, res) => {
  res.json({
    siteName: 'SecureBank',
    supportEmail: 'support@securebank.io',
    supportPhone: '1-800-SECURE-1',
    adminUsername: adminCredentials.username
    // passwords should never be sent back, even in a mock
  });
});

router.put('/settings', authenticateAdmin, (req, res) => {
  const { adminUsername, adminPassword, ...otherSettings } = req.body;

  if (adminUsername) {
    adminCredentials.username = adminUsername;
  }
  if (adminPassword) {
    adminCredentials.password = adminPassword;
  }

  // In a real app, you'd save otherSettings to a database too
  res.json({ success: true, message: 'Settings updated' });
});

// User Management
router.get('/users', authenticateAdmin, (req, res) => {
  res.json({ users });
});

router.post('/users', authenticateAdmin, (req, res) => {
  const { fullName, username, email, password } = req.body;

  if (!fullName || !username || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const newUser = {
    _id: Date.now().toString(),
    fullName,
    username,
    email,
    status: 'active',
    twoFAEnabled: false,
    lastLogin: null,
    createdAt: new Date().toISOString(),
    accounts: {
      checking: { balance: 0 },
      savings: { balance: 0 }
    }
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

// Mocking other user actions for AdminUsersPage.tsx to work
router.put('/users/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const user = users.find(u => u._id === id);
  if (user) {
    user.status = status;
    return res.json(user);
  }
  res.status(404).json({ message: 'User not found' });
});

router.delete('/users/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  users = users.filter(u => u._id !== id);
  res.json({ success: true });
});

router.post('/users/:id/terminate', authenticateAdmin, (req, res) => {
  res.json({ success: true });
});

export default router;
