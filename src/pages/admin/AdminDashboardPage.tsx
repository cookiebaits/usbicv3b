import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, DollarSign, TrendingUp, AlertCircle, Plus, ChevronDown, ChevronUp, Check, X, Loader2, CreditCard as Edit2, RefreshCw, Clock, UserCheck } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { formatCurrency, formatDatetime } from '../../lib/api';

interface User {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  status: string;
  twoFAEnabled: boolean;
  lastLogin: string;
  accounts: {
    checking: { balance: number; accountNumber: string };
    savings: { balance: number; accountNumber: string };
    bitcoin?: { btcBalance: number; usdValue: number };
  };
  recentTransactions?: Transaction[];
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  account?: string;
  status?: string;
}

interface PendingUser {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  ssn: string;
  address: { street: string; city: string; state: string; zip: string };
  createdAt: string;
}

const TX_TYPES = ['deposit', 'withdrawal', 'transfer', 'payment', 'crypto_buy', 'crypto_sell'];
const TX_ACCOUNTS = ['checking', 'savings', 'bitcoin'];

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [showAddTx, setShowAddTx] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [showEditTx, setShowEditTx] = useState<Transaction | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newTx, setNewTx] = useState({
    userId: '', type: 'deposit', account: 'checking', amount: '',
    description: '', status: 'completed',
  });

  const adminFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers as Record<string, string>),
      },
      credentials: 'include',
    });
    if (res.status === 401 || res.status === 403) { navigate('/admin/login'); throw new Error('Unauthorized'); }
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Request failed'); }
    return res.json();
  }, [navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, pendingData] = await Promise.all([
        adminFetch('/api/admin/dashboard'),
        adminFetch('/api/admin/users?status=pending').catch(() => ({ users: [] })),
      ]);
      setUsers(usersData.users || []);
      setPendingUsers(pendingData.users || []);
    } catch { /* already handled */ }
    finally { setLoading(false); }
  }, [adminFetch]);

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { navigate('/admin/login'); return; }
    fetchData();
  }, [navigate, fetchData]);

  const showMsg = (msg: string, isErr = false) => {
    if (isErr) { setError(msg); setSuccess(''); } else { setSuccess(msg); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.userId || !newTx.amount) { showMsg('Please fill in all required fields.', true); return; }
    setActionLoading('addTx');
    try {
      await adminFetch('/api/admin/transactions', {
        method: 'POST',
        body: JSON.stringify({ ...newTx, amount: parseFloat(newTx.amount) }),
      });
      showMsg('Transaction added successfully');
      setShowAddTx(false);
      setNewTx({ userId: '', type: 'deposit', account: 'checking', amount: '', description: '', status: 'completed' });
      fetchData();
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed to add transaction.', true);
    } finally { setActionLoading(null); }
  };

  const handleEditTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditTx) return;
    setActionLoading('editTx');
    try {
      await adminFetch(`/api/admin/transactions/${showEditTx._id}`, {
        method: 'PUT',
        body: JSON.stringify(showEditTx),
      });
      showMsg('Transaction updated');
      setShowEditTx(null);
      fetchData();
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed to update.', true);
    } finally { setActionLoading(null); }
  };

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminFetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'active' }),
      });
      setPendingUsers((prev) => prev.filter((u) => u._id !== userId));
      showMsg('User approved successfully');
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed to approve.', true);
    } finally { setActionLoading(null); }
  };

  const handleReject = async (userId: string) => {
    setActionLoading(userId + '-reject');
    try {
      await adminFetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      setPendingUsers((prev) => prev.filter((u) => u._id !== userId));
      showMsg('User rejected');
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed to reject.', true);
    } finally { setActionLoading(null); }
  };

  const totalBalance = users.reduce((acc, u) => acc + (u.accounts?.checking?.balance || 0) + (u.accounts?.savings?.balance || 0), 0);
  const activeUsers = users.filter((u) => u.status === 'active').length;

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
            <p className="text-slate-500 text-sm mt-0.5">Welcome to the admin portal</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="btn-ghost flex items-center gap-2 text-sm p-2">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowPending(true)}
              className="btn-secondary flex items-center gap-2 text-sm relative"
            >
              <Clock className="w-4 h-4" />
              Pending Approvals
              {pendingUsers.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-xs text-white font-bold flex items-center justify-center">
                  {pendingUsers.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowAddTx(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl p-4 text-sm">
            <Check className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: users.length, icon: Users, color: 'bg-blue-50 text-blue-600', change: `${activeUsers} active` },
            { label: 'Total Deposits', value: formatCurrency(totalBalance), icon: DollarSign, color: 'bg-emerald-50 text-emerald-600', change: 'All accounts' },
            { label: 'Pending Approvals', value: pendingUsers.length, icon: Clock, color: 'bg-amber-50 text-amber-600', change: 'Need review' },
            { label: 'Active Sessions', value: activeUsers, icon: UserCheck, color: 'bg-primary-50 text-primary-600', change: 'Online now' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                <p className="text-xs text-slate-400">{stat.change}</p>
              </div>
            );
          })}
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Users & Accounts</h2>
            <button onClick={() => navigate('/admin/users')} className="text-sm text-primary-600 font-semibold hover:text-primary-700">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['User', 'Account #', 'Checking', 'Savings', 'Status', '2FA', 'Last Login', ''].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 first:pl-6 last:pr-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.slice(0, 10).map((user) => (
                  <>
                    <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-700 font-bold text-xs">
                              {(user.fullName || user.username || 'U')[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{user.fullName || user.username}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600 font-mono">••{user.accounts?.checking?.accountNumber?.slice(-4) || '0000'}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">{formatCurrency(user.accounts?.checking?.balance || 0)}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">{formatCurrency(user.accounts?.savings?.balance || 0)}</td>
                      <td className="px-4 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                          user.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                          user.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>{user.status}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.twoFAEnabled ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                          {user.twoFAEnabled ? 'On' : 'Off'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-400">{user.lastLogin ? formatDatetime(user.lastLogin) : '—'}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setExpandedUser(expandedUser === user._id ? null : user._id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
                        >
                          {expandedUser === user._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                    {expandedUser === user._id && (
                      <tr key={`${user._id}-expanded`} className="bg-slate-50/50">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-slate-700">Recent Transactions</p>
                            <button
                              onClick={() => { setNewTx((p) => ({ ...p, userId: user._id })); setShowAddTx(true); }}
                              className="flex items-center gap-1.5 text-xs text-primary-600 font-semibold hover:text-primary-700"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add Transaction
                            </button>
                          </div>
                          {(!user.recentTransactions || user.recentTransactions.length === 0) ? (
                            <p className="text-sm text-slate-400">No transactions found</p>
                          ) : (
                            <div className="space-y-2">
                              {user.recentTransactions.slice(0, 5).map((tx) => (
                                <div key={tx._id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-slate-100">
                                  <div>
                                    <p className="text-sm font-medium text-slate-800">{tx.description || tx.type}</p>
                                    <p className="text-xs text-slate-400">{formatDatetime(tx.createdAt)} · {tx.account || 'checking'}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                    </span>
                                    <button
                                      onClick={() => setShowEditTx({ ...tx })}
                                      className="p-1 text-slate-400 hover:text-primary-600 transition-colors"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddTx && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-modal w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Add Transaction</h3>
              <button onClick={() => setShowAddTx(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddTx} className="p-6 space-y-4">
              <div>
                <label className="input-label">User</label>
                <select className="input-field" value={newTx.userId} onChange={(e) => setNewTx((p) => ({ ...p, userId: e.target.value }))}>
                  <option value="">Select a user...</option>
                  {users.map((u) => <option key={u._id} value={u._id}>{u.fullName || u.username} — {u.email}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Type</label>
                  <select className="input-field" value={newTx.type} onChange={(e) => setNewTx((p) => ({ ...p, type: e.target.value }))}>
                    {TX_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Account</label>
                  <select className="input-field" value={newTx.account} onChange={(e) => setNewTx((p) => ({ ...p, account: e.target.value }))}>
                    {TX_ACCOUNTS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="input-label">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                  <input className="input-field pl-8" type="number" step="0.01" value={newTx.amount} onChange={(e) => setNewTx((p) => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
                </div>
                <p className="text-xs text-slate-400 mt-1">Use negative values for withdrawals/debits</p>
              </div>
              <div>
                <label className="input-label">Description</label>
                <input className="input-field" value={newTx.description} onChange={(e) => setNewTx((p) => ({ ...p, description: e.target.value }))} placeholder="Transaction description..." />
              </div>
              <div>
                <label className="input-label">Status</label>
                <select className="input-field" value={newTx.status} onChange={(e) => setNewTx((p) => ({ ...p, status: e.target.value }))}>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddTx(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={actionLoading === 'addTx'}>
                  {actionLoading === 'addTx' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditTx && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-modal w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Edit Transaction</h3>
              <button onClick={() => setShowEditTx(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditTx} className="p-6 space-y-4">
              <div>
                <label className="input-label">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                  <input
                    className="input-field pl-8"
                    type="number"
                    step="0.01"
                    value={showEditTx.amount}
                    onChange={(e) => setShowEditTx((p) => p ? { ...p, amount: parseFloat(e.target.value) } : null)}
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Description</label>
                <input
                  className="input-field"
                  value={showEditTx.description}
                  onChange={(e) => setShowEditTx((p) => p ? { ...p, description: e.target.value } : null)}
                />
              </div>
              <div>
                <label className="input-label">Status</label>
                <select className="input-field" value={showEditTx.status || 'completed'} onChange={(e) => setShowEditTx((p) => p ? { ...p, status: e.target.value } : null)}>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditTx(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={actionLoading === 'editTx'}>
                  {actionLoading === 'editTx' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPending && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-modal w-full max-w-2xl max-h-[80vh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Pending Approvals ({pendingUsers.length})</h3>
              <button onClick={() => setShowPending(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {pendingUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Check className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-slate-500">All caught up! No pending approvals.</p>
                </div>
              ) : (
                pendingUsers.map((u) => (
                  <div key={u._id} className="border border-slate-100 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{u.fullName}</p>
                        <p className="text-sm text-slate-500">{u.email} · {u.phone}</p>
                        <p className="text-xs text-slate-400 mt-1">{u.address?.street}, {u.address?.city}, {u.address?.state} {u.address?.zip}</p>
                        <p className="text-xs text-slate-400">SSN: ••• - •• - {u.ssn?.slice(-4) || '••••'}</p>
                        <p className="text-xs text-slate-400">Applied: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleReject(u._id)}
                          disabled={actionLoading === u._id + '-reject'}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50"
                        >
                          {actionLoading === u._id + '-reject' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(u._id)}
                          disabled={actionLoading === u._id}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors disabled:opacity-50"
                        >
                          {actionLoading === u._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
