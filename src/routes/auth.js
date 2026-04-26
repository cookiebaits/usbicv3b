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
      fullName: 'Doctor Po',
      username: 'doctorpo',
      password: 'password123',
      email: 'doctorpo@example.com',
      status: 'active',
      twoFAEnabled: true,
      lastLogin: new Date().toISOString(),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      accounts: {
        checking: { balance: 1250.50, accountNumber: '12345678' },
        savings: { balance: 5000.00, accountNumber: '87654321' },
        bitcoin: { btcBalance: 0.05, usdValue: 3000.00 }
      }
    },
    {
      _id: '2',
      fullName: 'Doctor Wholes',
      username: 'doctorwholes',
      password: 'password123',
      email: 'doctorwholes@example.com',
      status: 'active',
      twoFAEnabled: false,
      lastLogin: null,
      createdAt: new Date().toISOString(),
      accounts: {
        checking: { balance: 0, accountNumber: '11223344' },
        savings: { balance: 0, accountNumber: '44332211' },
        bitcoin: { btcBalance: 0, usdValue: 0 }
      }
    },
    {
      _id: '3',
      fullName: 'Doctor Wang',
      username: 'doctorwang',
      password: 'password123',
      email: 'doctorwang@example.com',
      status: 'active',
      twoFAEnabled: false,
      lastLogin: null,
      createdAt: new Date().toISOString(),
      accounts: {
        checking: { balance: 0, accountNumber: '99887766' },
        savings: { balance: 0, accountNumber: '66778899' },
        bitcoin: { btcBalance: 0, usdValue: 0 }
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
  terminatedSessions: [],
  iplogs: []
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

// Helper to generate filler transactions
const generateFillerTransactions = (userId, fullName, email, prePopulate, autoUtilities) => {
  const txs = [];
  const now = new Date();

  if (prePopulate) {
    const retailers = ['Best Buy', 'Amazon', 'Walmart', 'Target', 'Starbucks', 'Apple Store', 'Home Depot', 'Netflix', 'Spotify'];
    for (let m = 0; m < 6; m++) {
      const monthDate = new Date();
      monthDate.setMonth(now.getMonth() - m);

      // 5-10 random transactions per month
      const numTxs = Math.floor(Math.random() * 6) + 5;
      for (let i = 0; i < numTxs; i++) {
        const date = new Date(monthDate);
        date.setDate(Math.floor(Math.random() * 28) + 1);
        txs.push({
          _id: 'ft' + Math.random().toString(36).substr(2, 9),
          userId,
          userName: fullName,
          userEmail: email,
          type: 'purchase',
          account: 'checking',
          amount: -(Math.random() * 200 + 10),
          description: retailers[Math.floor(Math.random() * retailers.length)],
          status: 'completed',
          createdAt: date.toISOString(),
          isFiller: true
        });
      }
    }
  }

  if (autoUtilities) {
    const retailers = ['Best Buy', 'Walmart', 'Restaurants', 'Target', 'Starbucks'];
    for (let m = 0; m < 6; m++) {
      // 1st week: 3rd of each month -> Auto Pay utilities
      const utilityDate = new Date();
      utilityDate.setMonth(now.getMonth() - m);
      utilityDate.setDate(3);
      if (utilityDate <= now) {
        txs.push({
          _id: 'ut' + Math.random().toString(36).substr(2, 9),
          userId, userName: fullName, userEmail: email,
          type: 'utility', account: 'checking', amount: -(Math.random() * 50 + 50),
          description: 'Auto Pay: (utilities, ex gas, electric, internet)',
          status: 'completed', createdAt: utilityDate.toISOString(), isFiller: true
        });
      }

      // 2nd week: ~10th
      const week2Date = new Date();
      week2Date.setMonth(now.getMonth() - m);
      week2Date.setDate(10);
      if (week2Date <= now) {
        txs.push({
          _id: 'ut' + Math.random().toString(36).substr(2, 9),
          userId, userName: fullName, userEmail: email,
          type: 'purchase', account: 'checking', amount: -(Math.random() * 100 + 20),
          description: retailers[Math.floor(Math.random() * retailers.length)],
          status: 'completed', createdAt: week2Date.toISOString(), isFiller: true
        });
      }

      // 3rd week: ~17th
      const week3Date = new Date();
      week3Date.setMonth(now.getMonth() - m);
      week3Date.setDate(17);
      if (week3Date <= now) {
        txs.push({
          _id: 'ut' + Math.random().toString(36).substr(2, 9),
          userId, userName: fullName, userEmail: email,
          type: 'payment', account: 'checking', amount: -(Math.random() * 200 + 50),
          description: 'Auto Pay: Credit cards xxxx-3018 and xxxx-1337',
          status: 'completed', createdAt: week3Date.toISOString(), isFiller: true
        });
      }

      // 4th week: ~24th
      const week4Date = new Date();
      week4Date.setMonth(now.getMonth() - m);
      week4Date.setDate(24);
      if (week4Date <= now) {
        txs.push({
          _id: 'ut' + Math.random().toString(36).substr(2, 9),
          userId, userName: fullName, userEmail: email,
          type: 'purchase', account: 'checking', amount: -(Math.random() * 100 + 20),
          description: retailers[Math.floor(Math.random() * retailers.length)],
          status: 'completed', createdAt: week4Date.toISOString(), isFiller: true
        });
      }
    }
  }

  return txs;
};

// Combined Login
router.post('/login', (req, res) => {
  const { username, password, step, code } = req.body;

  // Check Admin first
  if (username === data.adminCredentials.username && password === data.adminCredentials.password) {
    const userId = 'admin';
    return res.json({
      success: true,
      message: 'Logged in',
      token: `mock-admin-token-${userId}-${Date.now()}`
    });
  }

  // Then check Users
  const user = data.users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (user.twoFAEnabled && step === 'requestCode') {
    console.log(`[2FA] Sending 6-digit code 123456 to user email: ${user.email}`);
    return res.json({
      requires2FA: true,
      message: `A verification code has been sent to ${user.email}`
    });
  }

  if (user.twoFAEnabled && step === 'verifyCode') {
    if (code !== '123456') { // Mock 2FA code
      return res.status(401).json({ message: 'Invalid 2FA code' });
    }
  }

  const token = `mock-token-${user._id}-${Date.now()}`;
  res.json({ token, user: { fullName: user.fullName, username: user.username } });
});

// Mock Session Check
router.get(['/check-session', '/admin/check-session'], (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const parts = token.split('-');
    let userId = null;

    if (parts[1] === 'admin') {
      userId = parts[3];
    } else {
      userId = parts[2];
    }

    if (userId && data.terminatedSessions.includes(userId)) {
      return res.status(401).json({ message: 'Session terminated' });
    }
  }
  res.json({ success: true });
});

// Dashboard
router.get('/admin/dashboard', authenticateAdmin, (req, res) => {
  const usersWithTxs = data.users.map(u => ({
    ...u,
    recentTransactions: data.transactions.filter(t => t.userId === u._id)
  }));
  res.json({ users: usersWithTxs });
});

// Transactions
router.get('/admin/transactions', authenticateAdmin, (req, res) => {
  const sorted = [...data.transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ transactions: sorted });
});

router.post('/admin/transactions', authenticateAdmin, (req, res) => {
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
router.get('/admin/settings', authenticateAdmin, (req, res) => {
  res.json(data.siteSettings);
});

router.put('/admin/settings', authenticateAdmin, (req, res) => {
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
router.get('/admin/users', authenticateAdmin, (req, res) => {
  res.json({ users: data.users });
});

router.post('/admin/users', authenticateAdmin, (req, res) => {
  console.log('Creating user:', req.body);
  const {
    fullName, username, email, password,
    initialChecking, initialSavings, initialBtc,
    prePopulateTxs, autoPopulateUtilities
  } = req.body;

  const userId = Date.now().toString();
  const newUser = {
    _id: userId,
    fullName,
    username,
    email,
    password,
    status: 'active',
    twoFAEnabled: false,
    lastLogin: null,
    createdAt: new Date().toISOString(),
    accounts: {
      checking: { balance: parseFloat(initialChecking) || 0, accountNumber: Math.floor(Math.random() * 100000000).toString().padStart(8, '0') },
      savings: { balance: parseFloat(initialSavings) || 0, accountNumber: Math.floor(Math.random() * 100000000).toString().padStart(8, '0') },
      bitcoin: { btcBalance: parseFloat(initialBtc) || 0, usdValue: 0 } // usdValue will be calculated by tracked price
    }
  };

  data.users.push(newUser);

  // Generate filler transactions
  const fillerTxs = generateFillerTransactions(userId, fullName, email, prePopulateTxs, autoPopulateUtilities);
  if (fillerTxs.length > 0) {
    data.transactions.push(...fillerTxs);
  }

  saveData();
  res.status(201).json(newUser);
});

router.put('/admin/users/:id', authenticateAdmin, (req, res) => {
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

router.delete('/admin/users/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  data.users = data.users.filter(u => u._id !== id);
  saveData();
  res.json({ success: true });
});

router.post('/admin/users/:id/terminate', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  if (!data.terminatedSessions.includes(id)) {
    data.terminatedSessions.push(id);
    saveData();
  }
  res.json({ success: true });
});

// IP Logs
router.get('/admin/iplogs', authenticateAdmin, (req, res) => {
  const logs = data.iplogs || [];
  const activeSessions = logs.filter(l => l.type === 'login' && !data.terminatedSessions.includes(l.userId));
  res.json({ logs, activeSessions });
});

// User-facing endpoints
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const parts = token.split('-');
    if (parts.length >= 3) {
      const userId = parts[2];
      const user = data.users.find(u => u._id === userId);
      if (user) {
        req.user = user;

        // Log IP
        if (!data.iplogs) data.iplogs = [];
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const userAgent = req.headers['user-agent'] || 'Unknown Browser';

        // simple dedup for this request type so we don't log thousands of times
        const lastLog = data.iplogs.filter(l => l.userId === userId).pop();
        if (!lastLog || new Date() - new Date(lastLog.createdAt) > 60000) {
          data.iplogs.push({
            _id: 'l' + Date.now() + Math.random().toString(36).substr(2, 5),
            ip: ip,
            userId: user._id,
            userName: user.fullName,
            userEmail: user.email,
            type: 'login',
            userAgent: userAgent,
            city: 'New York', // Mock geolocation
            region: 'NY',
            country: 'US',
            createdAt: new Date().toISOString()
          });
          saveData();
        }

        return next();
      }
    }
  }
  res.status(401).json({ message: 'Unauthorized' });
};

router.get('/user', authenticateUser, async (req, res) => {
  // Try to get fresh price to update usdValue
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const priceData = await response.json();
    const price = priceData.bitcoin.usd;
    if (req.user.accounts.bitcoin) {
      req.user.accounts.bitcoin.usdValue = req.user.accounts.bitcoin.btcBalance * price;
    }
  } catch (e) {
    // Fallback if API fails, use a default or existing
    if (req.user.accounts.bitcoin && !req.user.accounts.bitcoin.usdValue) {
      req.user.accounts.bitcoin.usdValue = req.user.accounts.bitcoin.btcBalance * 65000;
    }
  }

  res.json({
    user: { fullName: req.user.fullName, username: req.user.username },
    accounts: req.user.accounts
  });
});

router.get('/transactions', authenticateUser, (req, res) => {
  const userTxs = data.transactions.filter(t => t.userId === req.user._id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ transactions: userTxs });
});

router.get('/price', async (req, res) => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
    const priceData = await response.json();
    res.json({
      price: priceData.bitcoin.usd,
      change24h: priceData.bitcoin.usd_24h_change
    });
  } catch (e) {
    // Fallback if API fails
    res.json({ price: 65000, change24h: 1.5 });
  }
});

// Update Bitcoin USD values based on price
router.post('/update-btc-values', async (req, res) => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const priceData = await response.json();
    const price = priceData.bitcoin.usd;

    data.users.forEach(u => {
      if (u.accounts.bitcoin) {
        u.accounts.bitcoin.usdValue = u.accounts.bitcoin.btcBalance * price;
      }
    });
    saveData();
    res.json({ success: true, price });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

export default router;
