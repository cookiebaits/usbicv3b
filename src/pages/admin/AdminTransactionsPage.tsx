import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, ArrowUpRight, ArrowDownLeft, ArrowLeftRight,
  Bitcoin, Loader2, Receipt, Check, AlertCircle, MoreVertical,
  Eye, User, ChevronDown,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { formatCurrency, formatDatetime } from '../../lib/api';

interface Transaction {
  _id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  account?: string;
  status?: string;
  btcAmount?: number;
  btcPrice?: number;
}

const TX_TYPE_FILTERS = ['all', 'deposit', 'withdrawal', 'transfer', 'crypto'];
const TX_STATUS_FILTERS = ['all', 'completed', 'pending', 'failed'];

function getTxIcon(type: string) {
  if (type?.includes('bitcoin') || type?.includes('crypto') || type?.includes('btc')) return Bitcoin;
  if (type?.includes('deposit') || type?.includes('receive')) return ArrowDownLeft;
  if (type?.includes('withdraw') || type?.includes('send')) return ArrowUpRight;
  return ArrowLeftRight;
}

export default function AdminTransactionsPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [txData] = await Promise.all([
        adminFetch('/api/admin/transactions'),
      ]);
      setTransactions(txData.transactions || []);
    } catch { /* handled */ }
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

  const updateStatus = async (txId: string, status: string) => {
    setOpenMenu(null);
    try {
      await adminFetch(`/api/admin/transactions/${txId}`, { method: 'PUT', body: JSON.stringify({ status }) });
      setTransactions((prev) => prev.map((t) => t._id === txId ? { ...t, status } : t));
      showMsg('Status updated');
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed to update.', true);
    }
  };

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (search) {
        const q = search.toLowerCase();
        if (!(tx.description || '').toLowerCase().includes(q) &&
            !(tx.userName || '').toLowerCase().includes(q) &&
            !(tx.userEmail || '').toLowerCase().includes(q) &&
            !(tx.type || '').toLowerCase().includes(q)) return false;
      }
      if (typeFilter !== 'all') {
        const t = tx.type?.toLowerCase() || '';
        if (typeFilter === 'crypto' && !t.includes('bitcoin') && !t.includes('crypto') && !t.includes('btc')) return false;
        if (typeFilter !== 'crypto' && !t.includes(typeFilter)) return false;
      }
      if (statusFilter !== 'all' && (tx.status || 'completed') !== statusFilter) return false;
      if (dateFrom && new Date(tx.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(tx.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [transactions, search, typeFilter, statusFilter, dateFrom, dateTo]);

  const totalAmount = filtered.reduce((a, t) => a + Math.abs(t.amount), 0);
  const totalDeposits = filtered.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const totalWithdrawals = filtered.filter((t) => t.amount < 0).reduce((a, t) => a + Math.abs(t.amount), 0);

  return (
    <AdminLayout title="Transactions">
      <div className="space-y-6" onClick={() => setOpenMenu(null)}>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-500 text-sm mt-0.5">{transactions.length} total transactions</p>
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

        <div className="grid grid-cols-3 gap-4">
          <div className="card p-5">
            <p className="text-xs text-slate-500 font-medium mb-1">Total Volume</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-slate-500 font-medium mb-1">Total Deposits</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalDeposits)}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-slate-500 font-medium mb-1">Total Withdrawals</p>
            <p className="text-xl font-bold text-red-500">{formatCurrency(totalWithdrawals)}</p>
          </div>
        </div>

        <div className="card p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className="input-field pl-9" placeholder="Search by description, user, or type..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <input type="date" className="input-field sm:w-40 text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <input type="date" className="input-field sm:w-40 text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Type:</span>
            {TX_TYPE_FILTERS.map((f) => (
              <button key={f} onClick={() => setTypeFilter(f)} className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize transition-colors ${typeFilter === f ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{f}</button>
            ))}
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            {TX_STATUS_FILTERS.map((f) => (
              <button key={f} onClick={() => setStatusFilter(f)} className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize transition-colors ${statusFilter === f ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{f}</button>
            ))}
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-visible">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Transaction', 'User', 'Date', 'Account', 'Amount', 'Status', ''].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 first:pl-6 last:pr-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((tx) => {
                    const Icon = getTxIcon(tx.type);
                    const isPositive = tx.amount > 0;
                    const status = tx.status || 'completed';
                    return (
                      <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
                              <Icon className={`w-5 h-5 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`} />
                            </div>
                            <div>
                              <p className="text-base font-semibold text-slate-900">{tx.description || tx.type}</p>
                              {tx.btcAmount && <p className="text-sm text-slate-500 font-medium">{Math.abs(tx.btcAmount).toFixed(6)} BTC</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {tx.userName ? (
                            <div>
                              <p className="text-sm font-medium text-slate-700">{tx.userName}</p>
                              <p className="text-xs text-slate-400">{tx.userEmail}</p>
                            </div>
                          ) : <span className="text-slate-400 text-sm">—</span>}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500">{formatDatetime(tx.createdAt)}</td>
                        <td className="px-4 py-4">
                          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full capitalize">{tx.account || 'checking'}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                            {isPositive ? '+' : ''}{formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                            status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                            status === 'pending' ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-700'
                          }`}>{status}</span>
                        </td>
                        <td className="px-6 py-4 relative overflow-visible">
                          <button onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === tx._id ? null : tx._id); }} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenu === tx._id && (
                            <div className="absolute right-4 top-12 w-48 bg-white rounded-xl border border-slate-100 shadow-modal z-50 overflow-visible" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => { setDetailTx(tx); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                                <Eye className="w-4 h-4" />Details
                              </button>
                              {tx.userId && (
                                <button onClick={() => { navigate('/admin/users'); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                                  <User className="w-4 h-4" />View User
                                </button>
                              )}
                              <div className="border-t border-slate-100 mt-1 pt-1">
                                <p className="px-4 py-1 text-xs text-slate-400 font-medium">Set Status</p>
                                {['completed', 'pending', 'failed'].map((s) => (
                                  <button key={s} onClick={() => updateStatus(tx._id, s)} className={`flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-slate-50 capitalize ${status === s ? 'text-primary-600 font-semibold' : 'text-slate-700'}`}>
                                    {status === s && <Check className="w-3.5 h-3.5" />}
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {detailTx && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-modal w-full max-w-md animate-slide-up">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Transaction Details</h3>
                <button onClick={() => setDetailTx(null)} className="text-slate-400 hover:text-slate-600"><ChevronDown className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-3">
                {[
                  ['ID', detailTx._id],
                  ['Type', detailTx.type],
                  ['Description', detailTx.description || '—'],
                  ['Amount', formatCurrency(detailTx.amount)],
                  ['Account', detailTx.account || 'checking'],
                  ['Status', detailTx.status || 'completed'],
                  ['Date', formatDatetime(detailTx.createdAt)],
                  ['User', detailTx.userName || '—'],
                  ['Email', detailTx.userEmail || '—'],
                  ...(detailTx.btcAmount ? [['BTC Amount', `${detailTx.btcAmount.toFixed(6)} BTC`]] : []),
                  ...(detailTx.btcPrice ? [['BTC Price at TX', formatCurrency(detailTx.btcPrice)]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-start gap-4">
                    <span className="text-sm text-slate-500 font-medium flex-shrink-0">{label}</span>
                    <span className="text-sm text-slate-900 font-medium text-right break-all">{value}</span>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6">
                <button onClick={() => setDetailTx(null)} className="btn-secondary w-full">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
