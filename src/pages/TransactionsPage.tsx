import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, ArrowUpRight, ArrowDownLeft, ArrowLeftRight,
  Bitcoin, Loader2, TrendingUp, TrendingDown, Receipt,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiFetch, formatCurrency, formatDatetime } from '../lib/api';
import { getToken } from '../hooks/useAuth';

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  account?: string;
  status?: string;
  btcAmount?: number;
  btcPrice?: number;
}

const ACCOUNT_FILTERS = ['All', 'Checking', 'Savings', 'Crypto'];
const AMOUNT_FILTERS = ['All', 'Income', 'Expenses'];

function getTxIcon(type: string) {
  if (type?.includes('bitcoin') || type?.includes('crypto') || type?.includes('btc')) return Bitcoin;
  if (type?.includes('deposit') || type?.includes('receive')) return ArrowDownLeft;
  if (type?.includes('withdraw') || type?.includes('send')) return ArrowUpRight;
  return ArrowLeftRight;
}

function getStatusBadge(status?: string) {
  switch (status?.toLowerCase()) {
    case 'completed': return <span className="badge-success">Completed</span>;
    case 'pending': return <span className="badge-warning">Pending</span>;
    case 'failed': return <span className="badge-error">Failed</span>;
    default: return <span className="badge-success">Completed</span>;
  }
}

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState('All');
  const [amountFilter, setAmountFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = useCallback(async () => {
    if (!getToken()) { navigate('/login'); return; }
    try {
      const data = await apiFetch('/api/transactions');
      setTransactions(data.transactions || []);
    } catch {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (search && !(tx.description || tx.type || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (accountFilter !== 'All') {
        const acc = tx.account?.toLowerCase() || '';
        if (accountFilter === 'Checking' && !acc.includes('checking')) return false;
        if (accountFilter === 'Savings' && !acc.includes('saving')) return false;
        if (accountFilter === 'Crypto' && !acc.includes('crypto') && !acc.includes('bitcoin')) return false;
      }
      if (amountFilter === 'Income' && tx.amount <= 0) return false;
      if (amountFilter === 'Expenses' && tx.amount >= 0) return false;
      if (dateFrom && new Date(tx.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(tx.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [transactions, search, accountFilter, amountFilter, dateFrom, dateTo]);

  const totalIncome = filtered.filter((t) => t.amount > 0).reduce((a, b) => a + b.amount, 0);
  const totalExpenses = filtered.filter((t) => t.amount < 0).reduce((a, b) => a + Math.abs(b.amount), 0);

  if (loading) {
    return (
      <DashboardLayout title="Transactions">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Transactions">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="page-header">Transaction History</h1>
          <p className="text-muted mt-1">View and filter all your past transactions</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Total</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{filtered.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">transactions</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-slate-500 font-medium">Income</span>
            </div>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
            <p className="text-xs text-slate-400 mt-0.5">received</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-xs text-slate-500 font-medium">Expenses</span>
            </div>
            <p className="text-xl font-bold text-red-500">{formatCurrency(totalExpenses)}</p>
            <p className="text-xs text-slate-400 mt-0.5">spent</p>
          </div>
        </div>

        <div className="card p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="input-field pl-9"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <input type="date" className="input-field text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <input type="date" className="input-field text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Account:</span>
            </div>
            {ACCOUNT_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setAccountFilter(f)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  accountFilter === f ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
            <div className="w-px bg-slate-200 mx-1"></div>
            {AMOUNT_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setAmountFilter(f)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  amountFilter === f ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-7 h-7 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700 mb-1">No transactions found</p>
              <p className="text-sm text-slate-400">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Description</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4 hidden sm:table-cell">Date</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4 hidden md:table-cell">Account</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Amount</th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4 hidden lg:table-cell">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((tx) => {
                    const Icon = getTxIcon(tx.type);
                    const isPositive = tx.amount > 0;
                    return (
                      <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
                              <Icon className={`w-4 h-4 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{tx.description || tx.type}</p>
                              {tx.btcAmount && <p className="text-xs text-slate-400">{tx.btcAmount.toFixed(6)} BTC</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500 hidden sm:table-cell">{formatDatetime(tx.createdAt)}</td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full capitalize">
                            {tx.account || 'Checking'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                            {isPositive ? '+' : ''}{formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center hidden lg:table-cell">
                          {getStatusBadge(tx.status)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
