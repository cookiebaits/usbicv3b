import { useSettings } from '../context/SettingsContext';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowLeft, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { settings } = useSettings();

  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'code' | 'password' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, step: 'request' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStep('code');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) { setError('Enter the code.'); return; }
    setStep('password');
    setError('');
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || !confirmPass) { setError('Please fill in all fields.'); return; }
    if (newPass !== confirmPass) { setError('Passwords do not match.'); return; }
    if (newPass.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword: newPass, step: 'reset' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-900">{settings.siteName}</span>
        </div>

        <div className="card p-8">
          {step !== 'done' && (
            <button onClick={() => step === 'email' ? navigate('/login') : setStep(step === 'code' ? 'email' : 'code')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {step === 'email' ? 'Back to login' : 'Back'}
            </button>
          )}

          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 mb-6 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'email' && (
            <>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Reset Password</h1>
              <p className="text-slate-500 text-sm mb-6">Enter your email and we&apos;ll send you a verification code.</p>
              <form onSubmit={handleEmail} className="space-y-4">
                <div>
                  <label className="input-label">Email Address</label>
                  <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" autoFocus />
                </div>
                <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </form>
            </>
          )}

          {step === 'code' && (
            <>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Enter Code</h1>
              <p className="text-slate-500 text-sm mb-6">We sent a code to <strong className="text-slate-700">{email}</strong>.</p>
              <form onSubmit={handleCode} className="space-y-4">
                <div>
                  <label className="input-label">Verification Code</label>
                  <input className="input-field text-center text-2xl font-bold tracking-widest" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} autoFocus />
                </div>
                <button type="submit" className="btn-primary w-full py-3">Continue</button>
              </form>
            </>
          )}

          {step === 'password' && (
            <>
              <h1 className="text-xl font-bold text-slate-900 mb-1">New Password</h1>
              <p className="text-slate-500 text-sm mb-6">Choose a strong new password for your account.</p>
              <form onSubmit={handlePassword} className="space-y-4">
                <div>
                  <label className="input-label">New Password</label>
                  <div className="relative">
                    <input className="input-field pr-12" type={showPass ? 'text' : 'password'} value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Min. 8 characters" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="input-label">Confirm Password</label>
                  <input className="input-field" type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Confirm new password" />
                </div>
                <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          {step === 'done' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Password Reset!</h2>
              <p className="text-slate-500 text-sm mb-6">Your password has been reset successfully. You can now sign in with your new password.</p>
              <button onClick={() => navigate('/login')} className="btn-primary w-full py-3">Sign In</button>
            </div>
          )}

          {step !== 'done' && (
            <p className="text-center text-sm text-slate-500 mt-6">
              Remember your password?{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
