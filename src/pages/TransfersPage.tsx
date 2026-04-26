import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight, Send, Users, Loader2, AlertCircle,
  CheckCircle, Trash2, ArrowRight, CreditCard, PiggyBank,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiFetch, formatCurrency } from '../lib/api';
import { getToken } from '../hooks/useAuth';
import { useSettings } from '../context/SettingsContext';

type TransferType = 'internal' | 'external' | 'zelle';

interface Contact { email: string; name?: string }
interface Balances {
  checking: number;
  savings: number;
}

export default function TransfersPage() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TransferType>('internal');
  const [balances, setBalances] = useState<Balances>({ checking: 0, savings: 0 });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'captcha' | '2fa' | 'verify' | 'success'>('form');
  const captcha = { question: '2 + 5 * 4', answer: 22 };
  const [captchaInput, setCaptchaInput] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [successData, setSuccessData] = useState<Record<string, string>>({});
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);

  const [internalForm, setInternalForm] = useState({ from: 'checking', to: 'savings', amount: '', memo: '' });
  const [externalForm, setExternalForm] = useState({ from: 'checking', amount: '', memo: '', recipientName: '', routingNumber: '', accountNumber: '', bankName: '', street: '', city: '', state: '', zip: '' });
  const [zelleForm, setZelleForm] = useState({ from: 'checking', amount: '', memo: '', recipient: '' });

  useEffect(() => {
    if (!getToken()) { navigate('/login'); return; }
    const stored = localStorage.getItem('zelleContacts');
    if (stored) setRecentContacts(JSON.parse(stored).slice(0, 5));
    apiFetch('/api/user').then((data) => {
      setBalances({ checking: data.accounts?.checking?.balance || 0, savings: data.accounts?.savings?.balance || 0 });
    }).catch(() => navigate('/login')).finally(() => setPageLoading(false));
  }, [navigate]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Internal goes directly to verify
    if (activeTab === 'internal') {
      setLoading(true);
      try {
        await apiFetch(`/api/transfer/${activeTab}/request`, {
          method: 'POST',
          body: JSON.stringify(internalForm),
        });
        setStep('verify');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Transfer failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // External goes to captcha first
      setStep('captcha');
    }
  }, [activeTab, internalForm]);

  const handleCaptchaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(parseInt(captchaInput) !== captcha.answer) {
      setError('Incorrect answer.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const form = activeTab === 'external' ? externalForm : zelleForm;
      // Request standard transfer which normally doesn't trigger 2fa,
      // but we need to trigger 2FA specifically. We will just reuse the login 2fa logic or mock it.
      // We will actually just show 2FA step now.

      // We will assume backend doesn't strictly need a 'requestCode' for transfers since it's not implemented,
      // But we will transition to '2fa' step to ask for the code.
      // In a real app we would send the 2FA code here.
      // We'll call the request endpoint just to validate the form.
      await apiFetch(`/api/transfer/${activeTab}/request`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setStep('2fa');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode) { setError('Please enter the verification code.'); return; }
    setError('');
    setLoading(true);
    try {
      const form = activeTab === 'internal' ? internalForm : activeTab === 'external' ? externalForm : zelleForm;
      const data = await apiFetch(`/api/transfer/${activeTab}/verify`, {
        method: 'POST',
        body: JSON.stringify({ ...form, code: verifyCode }),
      });
      if (activeTab === 'zelle' && zelleForm.recipient) {
        const stored = JSON.parse(localStorage.getItem('zelleContacts') || '[]');
        const updated = [{ email: zelleForm.recipient }, ...stored.filter((c: Contact) => c.email !== zelleForm.recipient)].slice(0, 5);
        localStorage.setItem('zelleContacts', JSON.stringify(updated));
      }
      setSuccessData({ amount: activeTab === 'internal' ? internalForm.amount : activeTab === 'external' ? externalForm.amount : zelleForm.amount, txId: data.transactionId || '' });
      setStep('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('form');
    setVerifyCode('');
    setError('');
    setSuccessData({});
  };

  const tabs: { id: TransferType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'internal', label: 'Between Accounts', icon: ArrowLeftRight },
    { id: 'external', label: 'External Bank', icon: CreditCard },
    { id: 'zelle', label: 'Zelle', icon: Send },
  ];

  if (pageLoading) {
    return (
      <DashboardLayout title="Transfers">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (step === 'success') {
    return (
      <DashboardLayout title="Transfers">
        <div className="max-w-md mx-auto">
          <div className="card p-10 text-center animate-slide-up">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Transfer Sent!</h2>
            <p className="text-slate-500 mb-6">Your transfer of {formatCurrency(parseFloat(successData.amount || '0'))} has been submitted successfully.</p>
            {successData.txId && <p className="text-xs text-slate-400 mb-8 font-mono">TX ID: {successData.txId}</p>}
            <div className="flex gap-3">
              <button onClick={resetForm} className="btn-secondary flex-1">New Transfer</button>
              <button onClick={() => navigate('/dashboard')} className="btn-primary flex-1">Dashboard</button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (step === 'verify') {
    return (
      <DashboardLayout title="Transfers">
        <div className="max-w-md mx-auto">
          <div className="card p-8 animate-slide-up">
            <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mb-6">
              <Send className="w-6 h-6 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Verify Transfer</h2>
            <p className="text-slate-500 text-sm mb-6">Enter the verification code sent to your registered contact.</p>
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 mb-5 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label className="input-label">Verification Code</label>
                <input className="input-field text-center text-xl font-bold tracking-widest" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} autoFocus />
              </div>
              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Verifying...' : 'Confirm Transfer'}
              </button>
              <button type="button" onClick={resetForm} className="btn-ghost w-full">Cancel</button>
            </form>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Transfers">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="page-header">Transfers</h1>
          <p className="text-muted mt-1">Send money between accounts or to others</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Checking Balance</p>
              <p className="font-bold text-slate-900">{formatCurrency(balances.checking)}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Savings Balance</p>
              <p className="font-bold text-slate-900">{formatCurrency(balances.savings)}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-full sm:w-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); resetForm(); }}
                className={`flex items-center gap-2 flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card p-6">
              {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 mb-5 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {activeTab === 'internal' && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="section-title">Transfer Between Accounts</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">From</label>
                      <select className="input-field" value={internalForm.from} onChange={(e) => setInternalForm((p) => ({ ...p, from: e.target.value }))}>
                        <option value="checking">Checking ({formatCurrency(balances.checking)})</option>
                        <option value="savings">Savings ({formatCurrency(balances.savings)})</option>
                      </select>
                    </div>
                    <div>
                      <label className="input-label">To</label>
                      <select className="input-field" value={internalForm.to} onChange={(e) => setInternalForm((p) => ({ ...p, to: e.target.value }))}>
                        <option value="savings">Savings</option>
                        <option value="checking">Checking</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                      <input className="input-field pl-8" type="number" step="0.01" min="0.01" value={internalForm.amount} onChange={(e) => setInternalForm((p) => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Memo (Optional)</label>
                    <input className="input-field" value={internalForm.memo} onChange={(e) => setInternalForm((p) => ({ ...p, memo: e.target.value }))} placeholder="Add a note..." />
                  </div>
                  <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {loading ? 'Processing...' : 'Transfer Funds'}
                  </button>
                </form>
              )}

              {activeTab === 'external' && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="section-title">External Bank Transfer</h2>
                  <div>
                    <label className="input-label">From Account</label>
                    <select className="input-field" value={externalForm.from} onChange={(e) => setExternalForm((p) => ({ ...p, from: e.target.value }))}>
                      <option value="checking">Checking ({formatCurrency(balances.checking)})</option>
                      <option value="savings">Savings ({formatCurrency(balances.savings)})</option>
                    </select>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Recipient Name</label>
                      <input className="input-field" value={externalForm.recipientName} onChange={(e) => setExternalForm((p) => ({ ...p, recipientName: e.target.value }))} placeholder="Full name" />
                    </div>
                    <div>
                      <label className="input-label">Bank Name</label>
                      <input className="input-field" value={externalForm.bankName} onChange={(e) => setExternalForm((p) => ({ ...p, bankName: e.target.value }))} placeholder="Bank name" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Routing Number</label>
                      <input className="input-field" value={externalForm.routingNumber} onChange={(e) => setExternalForm((p) => ({ ...p, routingNumber: e.target.value.replace(/\D/g, '').slice(0, 9) }))} placeholder="9 digits" maxLength={9} />
                    </div>
                    <div>
                      <label className="input-label">Account Number</label>
                      <input className="input-field" value={externalForm.accountNumber} onChange={(e) => setExternalForm((p) => ({ ...p, accountNumber: e.target.value.replace(/\D/g, '') }))} placeholder="Account number" />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                      <input className="input-field pl-8" type="number" step="0.01" min="0.01" value={externalForm.amount} onChange={(e) => setExternalForm((p) => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Memo (Optional)</label>
                    <input className="input-field" value={externalForm.memo} onChange={(e) => setExternalForm((p) => ({ ...p, memo: e.target.value }))} placeholder="Add a note..." />
                  </div>
                  <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {loading ? 'Processing...' : 'Send Transfer'}
                  </button>
                </form>
              )}

              {activeTab === 'zelle' && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {settings.zelleLogo ? <img src={settings.zelleLogo} alt="Zelle" className="h-8 mb-4 object-contain" /> : <h2 className="section-title">Send via Zelle</h2>}
                  <div>
                    <label className="input-label">From Account</label>
                    <select className="input-field" value={zelleForm.from} onChange={(e) => setZelleForm((p) => ({ ...p, from: e.target.value }))}>
                      <option value="checking">Checking ({formatCurrency(balances.checking)})</option>
                      <option value="savings">Savings ({formatCurrency(balances.savings)})</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Recipient (Email or Phone)</label>
                    <input className="input-field" value={zelleForm.recipient} onChange={(e) => setZelleForm((p) => ({ ...p, recipient: e.target.value }))} placeholder="email@example.com or phone number" />
                  </div>
                  <div>
                    <label className="input-label">Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                      <input className="input-field pl-8" type="number" step="0.01" min="0.01" value={zelleForm.amount} onChange={(e) => setZelleForm((p) => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Memo (Optional)</label>
                    <input className="input-field" value={zelleForm.memo} onChange={(e) => setZelleForm((p) => ({ ...p, memo: e.target.value }))} placeholder="What's this for?" />
                  </div>
                  <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {loading ? 'Processing...' : 'Send with Zelle'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {activeTab === 'zelle' && (
            <div>
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-slate-400" />
                  <h3 className="font-semibold text-sm text-slate-700">Recent Recipients</h3>
                </div>
                {recentContacts.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No recent recipients yet</p>
                ) : (
                  <div className="space-y-2">
                    {recentContacts.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 group transition-colors">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-bold text-xs">{c.email[0].toUpperCase()}</span>
                        </div>
                        <button
                          onClick={() => setZelleForm((p) => ({ ...p, recipient: c.email }))}
                          className="flex-1 text-left text-sm text-slate-700 font-medium truncate"
                        >
                          {c.email}
                        </button>
                        <button
                          onClick={() => setRecentContacts((prev) => prev.filter((_, j) => j !== i))}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
