import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bitcoin, TrendingUp, TrendingDown, ArrowUpDown, Send,
  ShoppingCart, DollarSign, Loader2, AlertCircle, CheckCircle,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useSettings } from '../context/SettingsContext';
import { apiFetch, formatCurrency } from '../lib/api';
import { getToken } from '../hooks/useAuth';

type Tab = 'buy' | 'sell' | 'send';

interface CryptoData {
  btcBalance: number;
  usdBalance: number;
  checkingBalance: number;
  btcPrice: number;
  priceChange: number;
  transactions: Array<{
    _id: string;
    type: string;
    amount: number;
    btcAmount?: number;
    btcPrice?: number;
    description: string;
    createdAt: string;
    status?: string;
  }>;
}

export default function CryptoPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<CryptoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('buy');
  const [amount, setAmount] = useState('');
  const [isBtcMode, setIsBtcMode] = useState(false);
  const [sendAddress, setSendAddress] = useState('');
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifyStep, setVerifyStep] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [success, setSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    if (!getToken()) { navigate('/login'); return; }
    try {
      const [userData, priceData, txData] = await Promise.all([
        apiFetch('/api/user'),
        apiFetch('/api/price'),
        apiFetch('/api/transactions'),
      ]);
      setData({
        btcBalance: userData.accounts?.bitcoin?.btcBalance || 0,
        usdBalance: userData.accounts?.bitcoin?.usdValue || 0,
        checkingBalance: userData.accounts?.checking?.balance || 0,
        btcPrice: priceData.price || 0,
        priceChange: priceData.change24h || 0,
        transactions: (txData.transactions || []).filter((t: { type?: string }) =>
          t.type?.includes('bitcoin') || t.type?.includes('crypto') || t.type?.includes('btc')
        ).slice(0, 10),
      });
    } catch {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const computedValue = () => {
    if (!data || !amount) return '';
    const val = parseFloat(amount);
    if (isNaN(val)) return '';
    if (isBtcMode) return `≈ ${formatCurrency(val * data.btcPrice)}`;
    return `≈ ${(val / data.btcPrice).toFixed(6)} BTC`;
  };

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) { setError('Please enter an amount.'); return; }
    setError('');
    setTxLoading(true);
    try {
      await apiFetch(`/api/transfer/bitcoin/${tab}`, {
        method: 'POST',
        body: JSON.stringify({ amount, isBtcMode, address: sendAddress }),
      });
      if (tab === 'send') {
        setVerifyStep(true);
      } else {
        setSuccess(true);
        fetchData();
        setAmount('');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Transaction failed. Please try again.');
    } finally {
      setTxLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode) { setError('Enter the verification code.'); return; }
    setError('');
    setTxLoading(true);
    try {
      await apiFetch('/api/transfer/bitcoin/verify', {
        method: 'POST',
        body: JSON.stringify({ code: verifyCode, amount, address: sendAddress, isBtcMode }),
      });
      setSuccess(true);
      setVerifyStep(false);
      setVerifyCode('');
      fetchData();
      setAmount('');
      setSendAddress('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setTxLoading(false);
    }
  };

  const formatDate = (str: string) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) {
    return (
      <DashboardLayout title="Crypto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  const pricePositive = (data?.priceChange || 0) >= 0;

  return (
    <DashboardLayout title="Crypto Wallet">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="page-header">Crypto Wallet</h1>
          <p className="text-muted mt-1">Buy, sell, and send Bitcoin from your dashboard</p>
        </div>

        {success && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl p-4 text-sm">
            <CheckCircle className="w-5 h-5" />
            <span>Transaction completed successfully!</span>
            <button onClick={() => setSuccess(false)} className="ml-auto text-emerald-500 hover:text-emerald-700">×</button>
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="card p-5 bg-gradient-to-br from-amber-500 to-orange-600 border-0">
            <div className="flex items-center gap-2 mb-3">
              <Bitcoin className="w-5 h-5 text-white/80" />
              <span className="text-white/80 text-xs font-medium">BTC Balance</span>
            </div>
            <p className="text-2xl font-bold text-white">{(data?.btcBalance || 0).toFixed(6)}</p>
            <p className="text-white/70 text-sm mt-1">{formatCurrency(data?.usdBalance || 0)}</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500 text-xs font-medium">BTC Price</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(data?.btcPrice || 0)}</p>
            <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${pricePositive ? 'text-emerald-600' : 'text-red-500'}`}>
              {pricePositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {pricePositive ? '+' : ''}{(data?.priceChange || 0).toFixed(2)}% 24h
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500 text-xs font-medium">Available USD</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(data?.checkingBalance || 0)}</p>
            <p className="text-slate-400 text-xs mt-1">Checking account</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6">
              {([
                { id: 'buy' as Tab, label: 'Buy', icon: ShoppingCart },
                { id: 'sell' as Tab, label: 'Sell', icon: DollarSign },
                { id: 'send' as Tab, label: 'Send', icon: Send },
              ] as const).map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setError(''); setVerifyStep(false); setAmount(''); }}
                    className={`flex items-center justify-center gap-2 flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 mb-5 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {!verifyStep ? (
              <form onSubmit={handleTrade} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="input-label mb-0">Amount</label>
                    <button type="button" onClick={() => setIsBtcMode(!isBtcMode)} className="flex items-center gap-1 text-xs text-primary-600 font-semibold hover:text-primary-700">
                      <ArrowUpDown className="w-3 h-3" />
                      Switch to {isBtcMode ? 'USD' : 'BTC'}
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{isBtcMode ? '₿' : '$'}</span>
                    <input
                      className="input-field pl-9"
                      type="number"
                      step="any"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                    />
                    {tab !== 'send' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!data) return;
                          if (tab === 'buy') setAmount(isBtcMode ? (data.checkingBalance / data.btcPrice).toFixed(6) : data.checkingBalance.toFixed(2));
                          else setAmount(isBtcMode ? data.btcBalance.toFixed(6) : data.usdBalance.toFixed(2));
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary-600 font-bold hover:text-primary-700"
                      >
                        MAX
                      </button>
                    )}
                  </div>
                  {computedValue() && <p className="text-xs text-slate-400 mt-1.5 text-right">{computedValue()}</p>}
                </div>
                {tab === 'send' && (
                  <div>
                    <label className="input-label">Bitcoin Address</label>
                    <input className="input-field font-mono text-xs" value={sendAddress} onChange={(e) => setSendAddress(e.target.value)} placeholder="bc1q..." />
                  </div>
                )}
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3" disabled={txLoading}>
                  {txLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {txLoading ? 'Processing...' : tab === 'buy' ? 'Buy Bitcoin' : tab === 'sell' ? 'Sell Bitcoin' : 'Send Bitcoin'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <p className="text-sm text-slate-500">Enter the verification code sent to your registered contact.</p>
                <div>
                  <label className="input-label">Verification Code</label>
                  <input className="input-field text-center text-xl font-bold tracking-widest" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} autoFocus />
                </div>
                <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2" disabled={txLoading}>
                  {txLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Confirm Send
                </button>
                <button type="button" onClick={() => { setVerifyStep(false); setVerifyCode(''); }} className="btn-ghost w-full">Cancel</button>
              </form>
            )}
          </div>

          <div className="card p-6">
            <h3 className="section-title mb-4">Transaction History</h3>
            <div className="space-y-3">
              {(data?.transactions || []).length === 0 ? (
                <div className="text-center py-8">
                  <Bitcoin className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No crypto transactions yet</p>
                </div>
              ) : (
                data?.transactions.map((tx) => (
                  <div key={tx._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      <Bitcoin className={`w-4 h-4 ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{tx.description || tx.type}</p>
                      <p className="text-xs text-slate-400">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </p>
                      {tx.btcAmount && <p className="text-xs text-slate-400">{Math.abs(tx.btcAmount).toFixed(6)} BTC</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
