import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Lock, Shield, Eye, EyeOff, Loader2,
  AlertCircle, CheckCircle, Save, X,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiFetch } from '../lib/api';
import { getToken } from '../hooks/useAuth';

type ProfileTab = 'info' | 'security' | '2fa';

interface UserData {
  fullName: string;
  email: string;
  phone: string;
  username: string;
  address?: { street: string; city: string; state: string; zip: string };
  twoFAEnabled?: boolean;
  twoFAMethod?: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<ProfileTab>('info');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [infoForm, setInfoForm] = useState({ fullName: '', email: '', phone: '', street: '', city: '', state: '', zip: '' });
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [passStep, setPassStep] = useState<'form' | 'verify'>('form');
  const [passCode, setPassCode] = useState('');

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState('email');
  const [twoFAModal, setTwoFAModal] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAAction, setTwoFAAction] = useState<'enable' | 'disable' | 'method'>('enable');

  const fetchData = useCallback(async () => {
    if (!getToken()) { navigate('/login'); return; }
    try {
      const data = await apiFetch('/api/user');
      const u = data.user;
      setUserData(u);
      setInfoForm({
        fullName: u.fullName || '',
        email: u.email || '',
        phone: u.phone || '',
        street: u.address?.street || '',
        city: u.address?.city || '',
        state: u.address?.state || '',
        zip: u.address?.zip || '',
      });
      setTwoFAEnabled(u.twoFAEnabled || false);
      setTwoFAMethod(u.twoFAMethod || 'email');
    } catch {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showMessage = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  const saveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/api/user', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: infoForm.fullName,
          email: infoForm.email,
          phone: infoForm.phone,
          address: { street: infoForm.street, city: infoForm.city, state: infoForm.state, zip: infoForm.zip },
        }),
      });
      showMessage('Profile updated successfully');
      fetchData();
    } catch (err: unknown) {
      showMessage(err instanceof Error ? err.message : 'Failed to update profile.', true);
    } finally {
      setSaving(false);
    }
  };

  const requestPassChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPass !== passForm.confirm) { showMessage('Passwords do not match.', true); return; }
    if (passForm.newPass.length < 8) { showMessage('Password must be at least 8 characters.', true); return; }
    setSaving(true);
    try {
      await apiFetch('/api/user/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: passForm.current, step: 'request' }),
      });
      setPassStep('verify');
    } catch (err: unknown) {
      showMessage(err instanceof Error ? err.message : 'Failed to initiate password change.', true);
    } finally {
      setSaving(false);
    }
  };

  const confirmPassChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/api/user/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: passForm.current, newPassword: passForm.newPass, code: passCode, step: 'verify' }),
      });
      showMessage('Password changed successfully');
      setPassForm({ current: '', newPass: '', confirm: '' });
      setPassCode('');
      setPassStep('form');
    } catch (err: unknown) {
      showMessage(err instanceof Error ? err.message : 'Verification failed.', true);
    } finally {
      setSaving(false);
    }
  };

  const request2FAChange = async (action: 'enable' | 'disable' | 'method') => {
    try {
      await apiFetch('/api/user/2fa', { method: 'POST', body: JSON.stringify({ action, method: twoFAMethod, step: 'request' }) });
      setTwoFAAction(action);
      setTwoFAModal(true);
      setTwoFACode('');
    } catch (err: unknown) {
      showMessage(err instanceof Error ? err.message : 'Failed.', true);
    }
  };

  const confirm2FAChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/api/user/2fa', {
        method: 'POST',
        body: JSON.stringify({ action: twoFAAction, method: twoFAMethod, code: twoFACode, step: 'verify' }),
      });
      setTwoFAModal(false);
      showMessage('Two-factor authentication updated');
      fetchData();
    } catch (err: unknown) {
      showMessage(err instanceof Error ? err.message : 'Verification failed.', true);
    } finally {
      setSaving(false);
    }
  };

  const initials = (userData?.fullName || userData?.username || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const tabs: { id: ProfileTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'info', label: 'Personal Info', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: '2fa', label: 'Two-Factor Auth', icon: Shield },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Profile">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Profile">
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <div className="card p-6 flex items-center gap-5">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">{initials}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{userData?.fullName || userData?.username}</h1>
            <p className="text-slate-500 text-sm">{userData?.email}</p>
            <p className="text-slate-400 text-xs mt-0.5">@{userData?.username}</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl p-4 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {tab === 'info' && (
          <form onSubmit={saveInfo} className="card p-6 space-y-5">
            <h2 className="section-title">Personal Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Full Name</label>
                <input className="input-field" value={infoForm.fullName} onChange={(e) => setInfoForm((p) => ({ ...p, fullName: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Email Address</label>
                <input className="input-field" type="email" value={infoForm.email} onChange={(e) => setInfoForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Phone Number</label>
                <input className="input-field" value={infoForm.phone} onChange={(e) => setInfoForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div className="divider pt-2">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 pt-4">Address</h3>
            </div>
            <div>
              <label className="input-label">Street</label>
              <input className="input-field" value={infoForm.street} onChange={(e) => setInfoForm((p) => ({ ...p, street: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="input-label">City</label>
                <input className="input-field" value={infoForm.city} onChange={(e) => setInfoForm((p) => ({ ...p, city: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">State</label>
                <input className="input-field" value={infoForm.state} onChange={(e) => setInfoForm((p) => ({ ...p, state: e.target.value }))} maxLength={2} />
              </div>
              <div>
                <label className="input-label">ZIP</label>
                <input className="input-field" value={infoForm.zip} onChange={(e) => setInfoForm((p) => ({ ...p, zip: e.target.value.replace(/\D/g, '').slice(0, 5) }))} maxLength={5} />
              </div>
            </div>
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {tab === 'security' && (
          <div className="card p-6 space-y-5">
            <h2 className="section-title">Change Password</h2>
            {passStep === 'form' ? (
              <form onSubmit={requestPassChange} className="space-y-4">
                {['current', 'new', 'confirm'].map((field) => (
                  <div key={field}>
                    <label className="input-label capitalize">{field === 'newPass' ? 'New Password' : field === 'confirm' ? 'Confirm Password' : 'Current Password'}</label>
                    <div className="relative">
                      <input
                        className="input-field pr-12"
                        type={showPass[field as keyof typeof showPass] ? 'text' : 'password'}
                        value={passForm[field as keyof typeof passForm]}
                        onChange={(e) => setPassForm((p) => ({ ...p, [field === 'new' ? 'newPass' : field]: e.target.value }))}
                        placeholder={field === 'current' ? 'Current password' : field === 'new' ? 'New password' : 'Confirm password'}
                      />
                      <button type="button" onClick={() => setShowPass((p) => ({ ...p, [field]: !p[field as keyof typeof p] }))} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600">
                        {showPass[field as keyof typeof showPass] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Change Password
                </button>
              </form>
            ) : (
              <form onSubmit={confirmPassChange} className="space-y-4">
                <p className="text-sm text-slate-500">Enter the verification code sent to your registered contact.</p>
                <div>
                  <label className="input-label">Verification Code</label>
                  <input className="input-field text-center text-xl font-bold tracking-widest" value={passCode} onChange={(e) => setPassCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} autoFocus />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Confirm
                  </button>
                  <button type="button" onClick={() => setPassStep('form')} className="btn-secondary">Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}

        {tab === '2fa' && (
          <div className="card p-6 space-y-6">
            <h2 className="section-title">Two-Factor Authentication</h2>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-semibold text-sm text-slate-900">2FA Status</p>
                <p className="text-xs text-slate-500 mt-0.5">{twoFAEnabled ? 'Enabled — your account is protected' : 'Disabled — enable for extra security'}</p>
              </div>
              <button
                onClick={() => request2FAChange(twoFAEnabled ? 'disable' : 'enable')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${twoFAEnabled ? 'bg-primary-600' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${twoFAEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {twoFAEnabled && (
              <div>
                <label className="input-label">Verification Method</label>
                <select
                  className="input-field"
                  value={twoFAMethod}
                  onChange={(e) => { setTwoFAMethod(e.target.value); request2FAChange('method'); }}
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS (Text Message)</option>
                </select>
              </div>
            )}
          </div>
        )}

        {twoFAModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-modal animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900">Verify Change</h3>
                <button onClick={() => setTwoFAModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-5">Enter the verification code sent to your registered contact.</p>
              <form onSubmit={confirm2FAChange} className="space-y-4">
                <input className="input-field text-center text-xl font-bold tracking-widest" value={twoFACode} onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} autoFocus />
                <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Confirm
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
