import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Shield, ArrowRight } from 'lucide-react';

export default function RegistrationSuccessPage() {
  const { settings } = useSettings();

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center animate-slide-up">
        <div className="card p-10">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Account Created!</h1>
          <p className="text-slate-500 leading-relaxed mb-8">
            Your {settings.siteName} account has been created successfully. Your checking and savings accounts are ready, and your crypto wallet has been set up.
          </p>

          <div className="space-y-3 mb-8 text-left">
            {[
              'Free checking account opened',
              'Free savings account opened',
              'Bitcoin wallet activated',
              'FDIC insured up to $250,000',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-sm text-slate-700">{item}</span>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/login')} className="btn-primary w-full py-3 flex items-center justify-center gap-2 mb-3">
            Sign In to Your Account
            <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => navigate('/')} className="btn-ghost w-full text-sm">Back to Home</button>

          <div className="flex items-center justify-center gap-1.5 mt-6">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">FDIC Insured · 256-bit SSL Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
