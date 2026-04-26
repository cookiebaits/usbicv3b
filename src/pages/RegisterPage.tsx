import { useSettings } from '../context/SettingsContext';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2, AlertCircle, Check, ArrowLeft, ArrowRight } from 'lucide-react';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  ssn: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  verificationCode: string;
  username: string;
  password: string;
  confirmPassword: string;
  twoFAMethod: string;
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

export default function RegisterPage() {
  const { settings } = useSettings();

  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState<FormData>({
    fullName: '', email: '', phone: '', ssn: '', street: '', city: '', state: '', zip: '',
    verificationCode: '', username: '', password: '', confirmPassword: '', twoFAMethod: 'email',
  });

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const formatSSN = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    const required = ['fullName', 'email', 'phone', 'ssn', 'street', 'city', 'state', 'zip'] as const;
    for (const field of required) {
      if (!form[field]) { setError('Please fill in all required fields.'); return; }
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName, email: form.email, phone: form.phone,
          ssn: form.ssn, address: { street: form.street, city: form.city, state: form.state, zip: form.zip },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.verificationCode) { setError('Please enter the verification code.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, code: form.verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed');
      setStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) { setError('Please fill in all fields.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/complete-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email, username: form.username,
          password: form.password, twoFAMethod: form.twoFAMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Account creation failed');
      navigate('/registration-success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    try {
      await fetch('/api/register/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
    } catch { /* ignore */ }
  };

  const steps = [
    { num: 1, label: 'Personal Info' },
    { num: 2, label: 'Verify Email' },
    { num: 3, label: 'Account Setup' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="hidden lg:flex w-80 xl:w-96 bg-gradient-to-br from-slate-900 to-primary-900 flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 left-0 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors mb-12">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
          <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center mb-6">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Create your free account</h2>
          <p className="text-slate-400 text-sm leading-relaxed">Join over 2 million users who trust {settings.siteName} for their daily banking.</p>
        </div>
        <div className="relative space-y-4">
          {['No monthly fees', 'FDIC insured up to $250K', 'Instant Zelle transfers', 'Crypto wallet included'].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-emerald-400" />
              </div>
              <span className="text-slate-300 text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900">{settings.siteName}</span>
            </div>
            <button onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-700 text-sm">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                  step > s.num ? 'bg-emerald-500 text-white' :
                  step === s.num ? 'bg-primary-600 text-white' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step === s.num ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 rounded-full ${step > s.num ? 'bg-emerald-500' : 'bg-slate-100'}`} />}
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 mb-6 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-5">
              <div>
                <h1 className="text-xl font-bold text-slate-900 mb-1">Personal information</h1>
                <p className="text-slate-500 text-sm">Tell us a bit about yourself to get started.</p>
              </div>
              <div>
                <label className="input-label">Full Name</label>
                <input className="input-field" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Email Address</label>
                  <input className="input-field" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="john@example.com" />
                </div>
                <div>
                  <label className="input-label">Phone Number</label>
                  <input className="input-field" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="(555) 000-0000" />
                </div>
              </div>
              <div>
                <label className="input-label">Social Security Number</label>
                <input
                  className="input-field"
                  value={form.ssn}
                  onChange={(e) => update('ssn', formatSSN(e.target.value))}
                  placeholder="XXX-XX-XXXX"
                  maxLength={11}
                />
              </div>
              <div>
                <label className="input-label">Street Address</label>
                <input className="input-field" value={form.street} onChange={(e) => update('street', e.target.value)} placeholder="123 Main Street" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="input-label">City</label>
                  <input className="input-field" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="City" />
                </div>
                <div>
                  <label className="input-label">State</label>
                  <select className="input-field" value={form.state} onChange={(e) => update('state', e.target.value)}>
                    <option value="">ST</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">ZIP</label>
                  <input className="input-field" value={form.zip} onChange={(e) => update('zip', e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="00000" maxLength={5} />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? 'Submitting...' : 'Continue'}
              </button>
              <p className="text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">Sign in</Link>
              </p>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-slate-900 mb-1">Verify your email</h1>
                <p className="text-slate-500 text-sm">We sent a 6-digit code to <strong className="text-slate-700">{form.email}</strong>. Enter it below to continue.</p>
              </div>
              <div>
                <label className="input-label">Verification Code</label>
                <input
                  className="input-field text-center text-2xl font-bold tracking-widest"
                  value={form.verificationCode}
                  onChange={(e) => update('verificationCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
              <p className="text-center text-sm text-slate-500">
                Didn&apos;t receive it?{' '}
                <button type="button" onClick={resendCode} className="text-primary-600 font-semibold hover:text-primary-700">Resend code</button>
              </p>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleStep3} className="space-y-5">
              <div>
                <h1 className="text-xl font-bold text-slate-900 mb-1">Account setup</h1>
                <p className="text-slate-500 text-sm">Choose a username and a secure password to protect your account.</p>
              </div>
              <div>
                <label className="input-label">Username</label>
                <input className="input-field" value={form.username} onChange={(e) => update('username', e.target.value)} placeholder="Choose a username" autoComplete="username" />
              </div>
              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <input
                    className="input-field pr-12"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="input-label">Confirm Password</label>
                <div className="relative">
                  <input
                    className="input-field pr-12"
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => update('confirmPassword', e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="input-label">Two-Factor Authentication Method</label>
                <select className="input-field" value={form.twoFAMethod} onChange={(e) => update('twoFAMethod', e.target.value)}>
                  <option value="email">Email</option>
                  <option value="sms">SMS (Text Message)</option>
                </select>
              </div>
              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
