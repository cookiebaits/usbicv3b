import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, PiggyBank, Eye, EyeOff, ArrowUpRight, ArrowDownLeft, Loader2, ArrowLeftRight } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiFetch, formatCurrency, formatDate, maskAccountNumber } from '../lib/api';
import { getToken } from '../hooks/useAuth';

interface Account {
  balance: number;
  accountNumber: string;
  status: string;
  openedAt: string;
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export default function AccountsPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState<Account | null>(null);
  const [savings, setSavings] = useState<Account | null>(null);
  const [checkingTx, setCheckingTx] = useState<Transaction[]>([]);
  const [savingsTx, setSavingsTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckingNum, setShowCheckingNum] = useState(false);
  const [showSavingsNum, setShowSavingsNum] = useState(false);

  const fetchData = useCallback(async () => {
    if (!getToken()) { navigate('/login'); return; }
    try {
      const [accountsData, txData] = await Promise.all([
        apiFetch('/api/accounts'),
        apiFetch('/api/transactions'),
      ]);
      setChecking(accountsData.checking);
      setSavings(accountsData.savings);
      const txList: Transaction[] = txData.transactions || [];
      setCheckingTx(txList.filter((t) => t.type?.includes('checking') || !t.type?.includes('saving')).slice(0, 5));
      setSavingsTx(txList.filter((t) => t.type?.includes('saving')).slice(0, 5));
    } catch {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <DashboardLayout title="Accounts">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  const AccountCard = ({
    type, icon: Icon, color, account, txList, showNum, setShowNum
  }: {
    type: string; icon: React.ComponentType<{ className?: string }>; color: string; account: Account | null;
    txList: Transaction[]; showNum: boolean; setShowNum: (v: boolean) => void;
  }) => (
    <div className="card overflow-hidden">
      <div className={`p-6 ${color}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{type}</p>
              <p className="text-white font-bold text-lg mt-0.5">
                {formatCurrency(account?.balance || 0)}
              </p>
            </div>
          </div>
          <span className="badge-success text-xs">{account?.status || 'Active'}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white/70 text-sm font-mono">
              {showNum ? account?.accountNumber || '—' : maskAccountNumber(account?.accountNumber || '')}
            </span>
            <button onClick={() => setShowNum(!showNum)} className="text-white/60 hover:text-white transition-colors">
              {showNum ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {account?.openedAt && (
            <span className="text-white/60 text-xs">Opened {formatDate(account.openedAt)}</span>
          )}
        </div>
      </div>

      <div className="p-4 flex gap-3">
        <button
          onClick={() => navigate('/dashboard/transfers')}
          className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 px-4 py-2.5 rounded-xl transition-colors"
        >
          <ArrowLeftRight className="w-4 h-4" />
          Transfer
        </button>
        <button
          onClick={() => navigate('/dashboard/transactions')}
          className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors"
        >
          History
        </button>
      </div>

      <div className="border-t border-slate-100">
        <div className="px-6 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent</span>
          <button onClick={() => navigate('/dashboard/transactions')} className="text-xs text-primary-600 font-semibold hover:text-primary-700">View All</button>
        </div>
        <div className="divide-y divide-slate-50">
          {txList.length === 0 ? (
            <p className="px-6 py-4 text-sm text-slate-400">No transactions yet</p>
          ) : (
            txList.map((tx) => (
              <div key={tx._id} className="flex items-center gap-3 px-6 py-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  {tx.amount > 0
                    ? <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                    : <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">{tx.description || tx.type}</p>
                  <p className="text-xs text-slate-400">{formatDate(tx.createdAt)}</p>
                </div>
                <span className={`text-sm font-semibold ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Accounts">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Your Accounts</h1>
            <p className="text-muted mt-1">Manage your checking and savings accounts</p>
          </div>
          <button onClick={() => navigate('/dashboard/transfers')} className="btn-primary flex items-center gap-2 text-sm">
            <ArrowLeftRight className="w-4 h-4" />
            Transfer
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <AccountCard
            type="Checking Account"
            icon={CreditCard}
            color="bg-gradient-to-br from-slate-900 to-slate-700"
            account={checking}
            txList={checkingTx}
            showNum={showCheckingNum}
            setShowNum={setShowCheckingNum}
          />
          <AccountCard
            type="Savings Account"
            icon={PiggyBank}
            color="bg-gradient-to-br from-primary-700 to-primary-900"
            account={savings}
            txList={savingsTx}
            showNum={showSavingsNum}
            setShowNum={setShowSavingsNum}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
