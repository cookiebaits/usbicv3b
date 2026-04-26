import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Check, X, Loader2,
  Trash2, UserCheck, Users, AlertCircle, MoreVertical,
  ShieldOff, UserX, WifiOff, UserPlus, Key, Shield,
} from 'lucide-react';
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
  createdAt: string;
  accounts: {
    checking: { balance: number };
    savings: { balance: number };
  };
}

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [twoFAFilter, setTwoFAFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [confirmTerminate, setConfirmTerminate] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newUser, setNewUser] = useState({
    fullName: '', username: '', email: '', password: '',
    initialChecking: '0', initialSavings: '0', initialBtc: '0',
    prePopulateTxs: false, autoPopulateUtilities: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const adminFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(options.headers as Record<string, string>) },
      credentials: 'include',
    });
    if (res.status === 401 || res.status === 403) { navigate('/admin/login'); throw new Error('Unauthorized'); }
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Failed'); }
    return res.json();
  }, [navigate]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch('/api/admin/users');
      setUsers(data.users || []);
    } catch { /* handled */ }
    finally { setLoading(false); }
  }, [adminFetch]);

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { navigate('/admin/login'); return; }
    fetchUsers();
  }, [navigate, fetchUsers]);

  const showMsg = (msg: string, isErr = false) => {
    if (isErr) { setError(msg); setSuccess(''); } else { setSuccess(msg); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  const filtered = useMemo(() => users.filter((u) => {
    if (search) {
      const q = search.toLowerCase();
      if (!u.fullName?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q) && !u.username?.toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (twoFAFilter === 'enabled' && !u.twoFAEnabled) return false;
    if (twoFAFilter === 'disabled' && u.twoFAEnabled) return false;
    return true;
  }), [users, search, statusFilter, twoFAFilter]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((u) => u._id)));
  };

  const updateStatus = async (userId: string, status: string) => {
    setActionLoading(userId);
    setOpenMenu(null);
    try {
      await adminFetch(`/api/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify({ status }) });
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, status } : u));
      showMsg(`User ${status === 'active' ? 'approved' : 'suspended'}`);
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed.', true);
    } finally { setActionLoading(null); }
  };

  const deleteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setConfirmDelete(null);
      showMsg('User deleted');
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed.', true);
    } finally { setActionLoading(null); }
  };

  const terminateSession = async (userId: string) => {
    setActionLoading(userId + '-terminate');
    try {
      await adminFetch(`/api/admin/users/${userId}/terminate`, { method: 'POST' });
      setConfirmTerminate(null);
      showMsg('Session terminated — user has been logged out');
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed to terminate session.', true);
    } finally { setActionLoading(null); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('create');
    try {
      await adminFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(newUser) });
      setShowCreateModal(false);
      setNewUser({
        fullName: '', username: '', email: '', password: '',
        initialChecking: '0', initialSavings: '0', initialBtc: '0',
        prePopulateTxs: false, autoPopulateUtilities: false
      });
      showMsg('User created successfully');
      fetchUsers();
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed to create user.', true);
    } finally { setActionLoading(null); }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPasswordModal) return;
    setActionLoading('password');
    try {
      await adminFetch(`/api/admin/users/${showPasswordModal._id}`, { method: 'PUT', body: JSON.stringify({ password: newPassword }) });
      setShowPasswordModal(null);
      setNewPassword('');
      showMsg('Password updated successfully');
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed to update password.', true);
    } finally { setActionLoading(null); }
  };

  const toggle2FA = async (user: User) => {
    setActionLoading(user._id + '-2fa');
    try {
      await adminFetch(`/api/admin/users/${user._id}`, { method: 'PUT', body: JSON.stringify({ twoFAEnabled: !user.twoFAEnabled }) });
      setUsers((prev) => prev.map((u) => u._id === user._id ? { ...u, twoFAEnabled: !u.twoFAEnabled } : u));
      showMsg(`2FA ${!user.twoFAEnabled ? 'enabled' : 'disabled'} for ${user.fullName || user.username}`);
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed.', true);
    } finally { setActionLoading(null); }
  };

  const bulkApprove = async () => {
    if (selected.size === 0) return;
    setActionLoading('bulk');
    try {
      await adminFetch('/api/admin/users/bulk-approve', { method: 'POST', body: JSON.stringify({ userIds: [...selected] }) });
      setUsers((prev) => prev.map((u) => selected.has(u._id) ? { ...u, status: 'active' } : u));
      setSelected(new Set());
      showMsg(`${selected.size} users approved`);
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Bulk action failed.', true);
    } finally { setActionLoading(null); }
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    setActionLoading('bulk-delete');
    try {
      await adminFetch('/api/admin/users/bulk-delete', { method: 'POST', body: JSON.stringify({ userIds: [...selected] }) });
      setUsers((prev) => prev.filter((u) => !selected.has(u._id)));
      setSelected(new Set());
      showMsg(`${selected.size} users deleted`);
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Bulk delete failed.', true);
    } finally { setActionLoading(null); }
  };

  return (
    <AdminLayout title="Users">
      <div className="space-y-6" onClick={() => setOpenMenu(null)}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Users</h1>
            <p className="text-slate-500 text-sm mt-0.5">{users.length} total accounts</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Create New User
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm">
            <AlertCircle className="w-4 h-4" /><span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl p-4 text-sm">
            <Check className="w-4 h-4" /><span>{success}</span>
          </div>
        )}

        <div className="card p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className="input-field pl-9" placeholder="Search by name, email or username..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-slate-400" />
            {['all', 'active', 'pending', 'suspended'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{s}</button>
            ))}
            <div className="w-px h-4 bg-slate-200 mx-1" />
            {['all', 'enabled', 'disabled'].map((f) => (
              <button key={f} onClick={() => setTwoFAFilter(f)} className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize transition-colors ${twoFAFilter === f ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>2FA: {f}</button>
            ))}
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-3 bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
            <span className="text-sm font-semibold text-primary-700">{selected.size} selected</span>
            <div className="flex gap-2 ml-auto">
              <button onClick={bulkApprove} disabled={actionLoading === 'bulk'} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
                {actionLoading === 'bulk' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                Approve All
              </button>
              <button onClick={bulkDelete} disabled={actionLoading === 'bulk-delete'} className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
                {actionLoading === 'bulk-delete' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete All
              </button>
              <button onClick={() => setSelected(new Set())} className="text-xs text-slate-500 hover:text-slate-700 px-2">Clear</button>
            </div>
          </div>
        )}

        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-visible">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded border-slate-300 text-primary-600" />
                    </th>
                    {['User', 'Checking', 'Savings', 'Status', '2FA', 'Joined', 'Last Login', ''].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 last:pr-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <input type="checkbox" checked={selected.has(user._id)} onChange={() => toggleSelect(user._id)} className="rounded border-slate-300 text-primary-600" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-700 font-bold text-xs">{(user.fullName || user.username || 'U')[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{user.fullName || user.username}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
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
                          {user.twoFAEnabled ? 'Enabled' : 'Off'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-400">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-4 text-xs text-slate-400">{user.lastLogin ? formatDatetime(user.lastLogin) : '—'}</td>
                      <td className="px-6 py-4 relative overflow-visible">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === user._id ? null : user._id); }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenu === user._id && (
                          <div className="absolute right-4 top-12 w-56 bg-white rounded-xl border border-slate-100 shadow-modal z-50 overflow-visible" onClick={(e) => e.stopPropagation()}>
                            {user.status !== 'active' && (
                              <button onClick={() => updateStatus(user._id, 'active')} disabled={!!actionLoading} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors">
                                <UserCheck className="w-4 h-4" />Approve User
                              </button>
                            )}
                            {user.status !== 'suspended' && (
                              <button onClick={() => updateStatus(user._id, 'suspended')} disabled={!!actionLoading} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition-colors">
                                <ShieldOff className="w-4 h-4" />Suspend User
                              </button>
                            )}
                            <button onClick={() => { setShowPasswordModal(user); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                              <Key className="w-4 h-4" />Change Password
                            </button>
                            <button onClick={() => { toggle2FA(user); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                              <Shield className="w-4 h-4" />{user.twoFAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                            </button>
                            <button onClick={() => { setConfirmTerminate(user); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors">
                              <WifiOff className="w-4 h-4" />Terminate Session
                            </button>
                            <div className="border-t border-slate-100" />
                            <button onClick={() => { setConfirmDelete(user); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                              <UserX className="w-4 h-4" />Delete User
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {confirmDelete && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-modal w-full max-w-sm p-8 animate-slide-up text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Delete User?</h3>
              <p className="text-slate-500 text-sm mb-6">This will permanently delete <strong>{confirmDelete.fullName || confirmDelete.username}</strong> and all their data. This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => deleteUser(confirmDelete._id)} disabled={actionLoading === confirmDelete._id} className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                  {actionLoading === confirmDelete._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-modal w-full max-w-sm p-8 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 text-lg">Change Password</h3>
                <button onClick={() => setShowPasswordModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <p className="text-sm text-slate-500">Updating password for <strong>{showPasswordModal.fullName || showPasswordModal.username}</strong></p>
                <div>
                  <label className="input-label">New Password</label>
                  <input
                    className="input-field"
                    type="password"
                    required
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowPasswordModal(null)} className="btn-secondary flex-1">Cancel</button>
                  <button
                    type="submit"
                    disabled={actionLoading === 'password'}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {actionLoading === 'password' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-modal w-full max-w-md p-8 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 text-lg">Create New User</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="input-label">Full Name</label>
                  <input
                    className="input-field"
                    required
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Username</label>
                    <input
                      className="input-field"
                      required
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      placeholder="johndoe"
                    />
                  </div>
                  <div>
                    <label className="input-label">Initial Password</label>
                    <input
                      className="input-field"
                      type="password"
                      required
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div>
                  <label className="input-label">Email Address</label>
                  <input
                    className="input-field"
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="input-label">Checking ($)</label>
                    <input
                      className="input-field"
                      type="number"
                      step="any"
                      value={newUser.initialChecking}
                      onChange={(e) => setNewUser({...newUser, initialChecking: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="input-label">Savings ($)</label>
                    <input
                      className="input-field"
                      type="number"
                      step="any"
                      value={newUser.initialSavings}
                      onChange={(e) => setNewUser({...newUser, initialSavings: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="input-label">Bitcoin (₿)</label>
                    <input
                      className="input-field"
                      type="number"
                      step="any"
                      value={newUser.initialBtc}
                      onChange={(e) => setNewUser({...newUser, initialBtc: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:bg-primary-600 checked:border-primary-600 transition-all"
                        checked={newUser.prePopulateTxs}
                        onChange={(e) => setNewUser({...newUser, prePopulateTxs: e.target.checked})}
                      />
                      <Check className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Pre-populate with Transactions</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:bg-primary-600 checked:border-primary-600 transition-all"
                        checked={newUser.autoPopulateUtilities}
                        onChange={(e) => setNewUser({...newUser, autoPopulateUtilities: e.target.checked})}
                      />
                      <Check className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Automatically populate utilities</span>
                  </label>
                  <p className="text-[10px] text-slate-400 italic">* Transactions are for filler content and won&apos;t affect the actual balance.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button
                    type="submit"
                    disabled={actionLoading === 'create'}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {actionLoading === 'create' ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {confirmTerminate && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-modal w-full max-w-sm p-8 animate-slide-up text-center">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <WifiOff className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Terminate Session?</h3>
              <p className="text-slate-500 text-sm mb-6">This will immediately log out <strong>{confirmTerminate.fullName || confirmTerminate.username}</strong> and invalidate their active token. They will need to sign in again.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmTerminate(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => terminateSession(confirmTerminate._id)} disabled={actionLoading === confirmTerminate._id + '-terminate'} className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                  {actionLoading === confirmTerminate._id + '-terminate' ? <Loader2 className="w-4 h-4 animate-spin" /> : <WifiOff className="w-4 h-4" />}
                  Terminate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
