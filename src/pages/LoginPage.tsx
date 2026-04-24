import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Eye, EyeOff, ArrowLeft, Loader2, AlertCircle, Lock } from 'lucide-react';
import { setToken } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFACode, setTwoFACode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/dashboard');
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter your username and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, step: 'requestCode' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      if (data.requires2FA) {
        setStep('2fa');
      } else {
        setToken(data.token);
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = twoFACode.join('');
    if (code.length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, code, step: 'verifyCode' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed');
      setToken(data.token);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
      setTwoFACode(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const handle2FAInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...twoFACode];
    newCode[index] = value.slice(-1);
    setTwoFACode(newCode);
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handle2FAKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !twoFACode[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative text-center">
          <div className="w-20 h-20 bg-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Welcome back</h2>
          <p className="text-slate-400 text-lg max-w-sm">Securely access your banking dashboard and manage your finances.</p>
          <div className="mt-12 grid grid-cols-2 gap-4 text-center">
            {[
              { label: 'Bank-Level Security', sub: 'AES-256 Encrypted' },
              { label: 'Global Accessibility', sub: '40+ Countries Supported' },
              { label: 'Instant Transfers', sub: 'Via Zelle network' },
              { label: 'BTC Support', sub: 'Free For Members' },
            ].map((item) => (
              <div key={item.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-white font-semibold text-sm">{item.label}</p>
                <p className="text-slate-400 text-xs mt-1">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:max-w-md lg:flex-none lg:w-[480px]">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">International Credit Unions</span>
          </div>

          {step === 'credentials' ? (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Sign in</h1>
                <p className="text-slate-500 text-sm">Enter your credentials to access your account</p>
              </div>

              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 mb-6 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    {error}{' '}
                    <a href="mailto:support@International Credit Unions.io" className="underline font-medium">Contact support</a>
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="input-label">Username</label>
                  <input
                    className="input-field"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="input-label">Password</label>
                  <div className="relative">
                    <input
                      className="input-field pr-12"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="mt-2 text-right">
                    <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                      Forgot password?
                    </Link>
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-8">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">Create account</Link>
              </p>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep('credentials'); setError(''); setTwoFACode(['', '', '', '', '', '']); }}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium mb-8 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </button>

              <div className="mb-8">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
                  <Shield className="w-7 h-7 text-primary-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Two-factor verification</h1>
                <p className="text-slate-500 text-sm">Enter the 6-digit code sent to your registered contact.</p>
              </div>

              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 mb-6 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handle2FA}>
                <div className="flex gap-3 justify-center mb-8">
                  {twoFACode.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handle2FAInput(i, e.target.value)}
                      onKeyDown={(e) => handle2FAKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-slate-200 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 text-slate-900"
                    />
                  ))}
                </div>
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>
            </>
          )}

          <div className="flex items-center justify-center gap-1.5 mt-10">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">256-bit SSL encrypted connection</span>
          </div>
        </div>
      </div>
    </div>
  );
}
