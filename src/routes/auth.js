// src/routes/auth.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as config from '../../config/config.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../../data.json');

// Initialize data
let data = {
  adminCredentials: {
    username: config.ADMIN_USER,
    password: config.ADMIN_PASS
  },
  siteSettings: {
    siteName: 'SecureBank',
    supportEmail: 'support@securebank.io',
    supportPhone: '1-800-SECURE-1',
    instagramUrl: '',
    twitterUrl: '',
    facebookUrl: '',
    primaryColor: '#2563EB',
    primaryFontColor: '#FFFFFF',
    secondaryColor: '#1E293B',
    privacyPolicy: '',
    termsOfService: '',
    siteLogo: '',
    zelleLogo: '',
    twoFALogo: '',
    adminUsername: config.ADMIN_USER
  },
  users: [
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
        checking: { balance: 1250.50, accountNumber: '12345678' },
        savings: { balance: 5000.00, accountNumber: '87654321' }
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
        checking: { balance: 0, accountNumber: '11223344' },
        savings: { balance: 0, accountNumber: '44332211' }
      }
    }
  ],
  transactions: [
    {
      _id: 't1',
      userId: '1',
      userName: 'John Doe',
      userEmail: 'john@example.com',
      type: 'deposit',
      amount: 500,
      description: 'Initial deposit',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      account: 'checking',
      status: 'completed'
    }
  ],
  terminatedSessions: []
};

// Load data from file if exists
if (fs.existsSync(DATA_FILE)) {
  try {
    const savedData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    data = { ...data, ...savedData };
  } catch (e) {
    console.error('Failed to load data file:', e);
  }
}

const saveData = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to save data file:', e);
  }
};

// Authentication middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token.startsWith('mock-admin-token')) {
      return next();
    }
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Admin Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === data.adminCredentials.username && password === data.adminCredentials.password) {
    const userId = 'admin'; // For mock purposes
    return res.json({
      success: true,
      message: 'Logged in',
      token: `mock-admin-token-${userId}-${Date.now()}`
    });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// Mock Session Check
router.get('/check-session', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const parts = token.split('-');
    if (parts.length >= 4) {
      const userId = parts[3];
      if (data.terminatedSessions.includes(userId)) {
        return res.status(401).json({ message: 'Session terminated' });
      }
    }
  }
  res.json({ success: true });
});

// Dashboard
router.get('/dashboard', authenticateAdmin, (req, res) => {
  const usersWithTxs = data.users.map(u => ({
    ...u,
    recentTransactions: data.transactions.filter(t => t.userId === u._id)
  }));
  res.json({ users: usersWithTxs });
});

// Transactions
router.get('/transactions', authenticateAdmin, (req, res) => {
  res.json({ transactions: data.transactions });
});

router.post('/transactions', authenticateAdmin, (req, res) => {
  const { userId, type, account, amount, description, status } = req.body;
  const user = data.users.find(u => u._id === userId);

  const newTx = {
    _id: 't' + Date.now(),
    userId,
    userName: user ? user.fullName : 'Unknown',
    userEmail: user ? user.email : 'Unknown',
    type,
    account,
    amount: parseFloat(amount),
    description,
    status,
    createdAt: new Date().toISOString()
  };

  data.transactions.unshift(newTx);

  // Update user balance
  if (user && status === 'completed') {
    if (account === 'checking') user.accounts.checking.balance += newTx.amount;
    if (account === 'savings') user.accounts.savings.balance += newTx.amount;
  }

  saveData();
  res.status(201).json(newTx);
});

// Settings
router.get('/settings', authenticateAdmin, (req, res) => {
  res.json(data.siteSettings);
});

router.put('/settings', authenticateAdmin, (req, res) => {
  const { adminUsername, adminPassword, ...otherSettings } = req.body;

  data.siteSettings = { ...data.siteSettings, ...otherSettings };

  if (adminUsername) {
    data.adminCredentials.username = adminUsername;
    data.siteSettings.adminUsername = adminUsername;
  }
  if (adminPassword) {
    data.adminCredentials.password = adminPassword;
  }

  saveData();
  res.json({ success: true, message: 'Settings updated', settings: data.siteSettings });
});

// Users
router.get('/users', authenticateAdmin, (req, res) => {
  res.json({ users: data.users });
});

router.post('/users', authenticateAdmin, (req, res) => {
  const { fullName, username, email, password } = req.body;

  const newUser = {
    _id: Date.now().toString(),
    fullName,
    username,
    email,
    password, // Store password for change feature
    status: 'active',
    twoFAEnabled: false,
    lastLogin: null,
    createdAt: new Date().toISOString(),
    accounts: {
      checking: { balance: 0, accountNumber: Math.floor(Math.random() * 100000000).toString().padStart(8, '0') },
      savings: { balance: 0, accountNumber: Math.floor(Math.random() * 100000000).toString().padStart(8, '0') }
    }
  };

  data.users.push(newUser);
  saveData();
  res.status(201).json(newUser);
});

router.put('/users/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { status, password, twoFAEnabled } = req.body;
  const user = data.users.find(u => u._id === id);
  if (user) {
    if (status !== undefined) user.status = status;
    if (password !== undefined) user.password = password;
    if (twoFAEnabled !== undefined) user.twoFAEnabled = twoFAEnabled;
    saveData();
    return res.json(user);
  }
  res.status(404).json({ message: 'User not found' });
});

router.delete('/users/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  data.users = data.users.filter(u => u._id !== id);
  saveData();
  res.json({ success: true });
});

router.post('/users/:id/terminate', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  if (!data.terminatedSessions.includes(id)) {
    data.terminatedSessions.push(id);
    saveData();
  }
  res.json({ success: true });
});

// IP Logs
router.get('/iplogs', authenticateAdmin, (req, res) => {
  const logs = [
    {
      _id: 'l1',
      ip: '127.0.0.1',
      userId: '1',
      userName: 'John Doe',
      userEmail: 'john@example.com',
      type: 'login',
      createdAt: new Date().toISOString()
    }
  ];

  // Return active sessions too (those not in terminatedSessions)
  const activeSessions = logs.filter(l => l.type === 'login' && !data.terminatedSessions.includes(l.userId));

  res.json({ logs, activeSessions });
});

export default router;
