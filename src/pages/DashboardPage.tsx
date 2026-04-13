import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Bitcoin,
  TrendingUp, TrendingDown, Eye, EyeOff, RefreshCw,
  CreditCard, Wallet, PiggyBank, Loader2,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiFetch, formatCurrency, formatDatetime } from '../lib/api';
import { getToken } from '../hooks/useAuth';

interface Account {
  checking: { balance: number; accountNumber: string };
  savings: { balance: number; accountNumber: string };
  bitcoin: { btcBalance: number; usdValue: number };
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  account?: string;
  status?: string;
  btcAmount?: number;
}

interface User {
  fullName: string;
  username: string;
}

function getTransactionIcon(type: string) {
  if (type?.includes('deposit') || type?.includes('receive')) return ArrowDownLeft;
  if (type?.includes('withdraw') || type?.includes('send')) return ArrowUpRight;
  if (type?.includes('transfer')) return ArrowLeftRight;
  if (type?.includes('bitcoin') || type?.includes('crypto') || type?.includes('btc')) return Bitcoin;
  return ArrowLeftRight;
}

function getTransactionColor(type: string, amount: number) {
  if (amount > 0) return 'text-emerald-600';
  return 'text-red-500';
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hideBalances, setHideBalances] = useState(false);

  const fetchData = useCallback(async () => {
    if (!getToken()) { navigate('/login'); return; }
    try {
      const [userData, txData, priceData] = await Promise.all([
        apiFetch('/api/user'),
        apiFetch('/api/transactions'),
        apiFetch('/api/price'),
      ]);
      setUser(userData.user);
      setAccounts(userData.accounts);
      setTransactions(txData.transactions?.slice(0, 10) || []);
      setBtcPrice(priceData.price || null);
    } catch {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  const totalBalance = (accounts?.checking.balance || 0) + (accounts?.savings.balance || 0);

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold text-slate-900">{user?.fullName || user?.username || 'there'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setHideBalances(!hideBalances)} className="btn-ghost flex items-center gap-2 text-sm">
              {hideBalances ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {hideBalances ? 'Show' : 'Hide'}
            </button>
            <button onClick={fetchData} className="btn-ghost p-2">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-slate-900 to-primary-900 border-0">
          <p className="text-slate-400 text-sm mb-1">Total Balance</p>
          <p className="text-4xl font-extrabold text-white mb-4">
            {hideBalances ? '••••••' : formatCurrency(totalBalance)}
          </p>
          <div className="flex items-center gap-2">
            <span className="badge-success text-xs">Active</span>
            <span className="text-slate-400 text-xs">All accounts combined</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="card p-5 hover:shadow-card-hover transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/accounts')}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs text-slate-400">Checking</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {hideBalances ? '••••' : formatCurrency(accounts?.checking.balance || 0)}
            </p>
            <p className="text-xs text-slate-400 mt-1">••{accounts?.checking.accountNumber?.slice(-4) || '0000'}</p>
          </div>

          <div className="card p-5 hover:shadow-card-hover transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/accounts')}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xs text-slate-400">Savings</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {hideBalances ? '••••' : formatCurrency(accounts?.savings.balance || 0)}
            </p>
            <p className="text-xs text-slate-400 mt-1">••{accounts?.savings.accountNumber?.slice(-4) || '0000'}</p>
          </div>

          <div className="card p-5 hover:shadow-card-hover transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/crypto')}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Bitcoin className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-xs text-slate-400">Bitcoin</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {hideBalances ? '••••' : formatCurrency(accounts?.bitcoin.usdValue || 0)}
            </p>
            <p className="text-xs text-slate-400 mt-1">{hideBalances ? '••••' : `${(accounts?.bitcoin.btcBalance || 0).toFixed(6)} BTC`}</p>
            {btcPrice && <p className="text-xs text-slate-400">{formatCurrency(btcPrice)} / BTC</p>}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Transfer', icon: ArrowLeftRight, href: '/dashboard/transfers', color: 'bg-blue-50 text-blue-600' },
            { label: 'Zelle', icon: Wallet, href: '/dashboard/transfers', color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Crypto', icon: Bitcoin, href: '/dashboard/crypto', color: 'bg-amber-50 text-amber-600' },
            { label: 'Accounts', icon: CreditCard, href: '/dashboard/accounts', color: 'bg-slate-100 text-slate-600' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.href)}
                className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow text-left"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${action.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm text-slate-700">{action.label}</span>
              </button>
            );
          })}
        </div>

        <div className="card">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="section-title">Recent Transactions</h2>
            <button onClick={() => navigate('/dashboard/transactions')} className="text-sm text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {transactions.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ArrowLeftRight className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-500 text-sm">No transactions yet</p>
              </div>
            ) : (
              transactions.map((tx) => {
                const Icon = getTransactionIcon(tx.type);
                const isPositive = tx.amount > 0;
                return (
                  <div key={tx._id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      <Icon className={`w-4 h-4 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{tx.description || tx.type}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDatetime(tx.createdAt)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-semibold text-sm ${getTransactionColor(tx.type, tx.amount)}`}>
                        {isPositive ? '+' : ''}{formatCurrency(tx.amount)}
                      </p>
                      {tx.account && <p className="text-xs text-slate-400 capitalize">{tx.account}</p>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-sm text-slate-700">Bitcoin Tracker</span>
            </div>
            {btcPrice ? (
              <>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(btcPrice)}</p>
                <p className="text-xs text-slate-400 mt-1">Current BTC/USD price</p>
              </>
            ) : (
              <p className="text-sm text-slate-400">Price unavailable</p>
            )}
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-sm text-slate-700">Transfer Limits</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">$10,000</p>
            <p className="text-xs text-slate-400 mt-1">Daily wire transfer limit</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
