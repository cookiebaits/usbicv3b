import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Zap,
  ChevronRight,
  Check,
  Star,
  Lock,
  Globe,
  TrendingUp,
  Bitcoin,
  Phone,
  Mail,
  ChevronDown,
  ArrowRight,
  CreditCard,
  RefreshCw,
  Users,
  Award,
} from 'lucide-react';

const stats = [
  { label: 'Active Users', value: '2M+' },
  { label: 'Transactions Daily', value: '$850M' },
  { label: 'Countries Supported', value: '40+' },
  { label: 'Uptime', value: '99.99%' },
];

const features = [
  {
    icon: Shield,
    title: 'Bank-Level Security',
    desc: 'AES-256 encryption protects every transaction and your personal data at rest and in transit.',
    items: ['256-bit SSL Encryption', 'Biometric Authentication', 'Real-time Fraud Detection'],
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Zap,
    title: 'Instant Transfers',
    desc: 'Send money instantly via Zelle to anyone across the US with zero fees on personal transfers.',
    items: ['Zelle Integration', 'Same-Day ACH', 'Wire Transfers in 24h'],
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Globe,
    title: 'Free International Banking',
    desc: 'Open checking and savings accounts with no monthly fees, minimum balances, or hidden charges.',
    items: ['No Monthly Fees', 'Free Checking & Savings', 'FDIC Insured up to $250K'],
    color: 'bg-emerald-50 text-emerald-300',
  },
];

const faqs = [
  {
    q: 'How do I open an account?',
    a: 'Opening an account takes less than 5 minutes. Click "Get Started" and follow our simple three-step registration process. All you need is a valid ID and SSN.',
  },
  {
    q: 'Is my money FDIC insured?',
    a: 'Yes. Deposits are insured by the FDIC up to $250,000 per depositor, per account ownership category.',
  },
  {
    q: 'How fast are Zelle transfers?',
    a: 'Zelle transfers between enrolled users are typically completed within minutes. First-time recipients may see a 1–3 business day delay.',
  },
  {
    q: 'What fees do you charge?',
    a: 'We believe banking should be free. We charge no monthly maintenance fees, no minimum balance fees, and no overdraft fees.',
  },
  {
    q: 'Can I access cryptocurrency?',
    a: 'Yes. Our integrated crypto wallet lets you buy, sell, and hold Bitcoin directly from your banking dashboard.',
  },
  {
    q: 'How do I reset my password?',
    a: 'Click "Forgot Password" on the login page and follow the email verification flow to securely reset your credentials.',
  },
];

const partners = [
  'Chase', 'Bank of America', 'Wells Fargo', 'Citibank', 'US Bank',
];

const cryptos = [
  { name: 'Bitcoin', symbol: 'BTC', icon: Bitcoin, change: '+2.4%', color: 'text-amber-500' },
  { name: 'Ethereum', symbol: 'ETH', icon: TrendingUp, change: '+1.8%', color: 'text-blue-500' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-400">International Credit Unions</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#security" className="hover:text-slate-900 transition-colors">Security</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors px-3 py-2"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary text-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium px-4 py-2 rounded-full mb-8">
            <Award className="w-4 h-4 text-amber-400" />
            <span>2024-25 Best International Banking — DP Security Awards</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
            Banking made{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              simple & secure
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Free checking and savings accounts, instant Zelle transfers, and integrated crypto — all in one beautifully simple app.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 bg-white text-slate-900 font-bold px-7 py-4 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-base w-full sm:w-auto justify-center"
            >
              Open Free Account
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 bg-white/10 border border-white/20 text-white font-semibold px-7 py-4 rounded-2xl hover:bg-white/20 transition-all duration-200 text-base w-full sm:w-auto justify-center"
            >
              Sign In
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 pt-10 border-t border-white/10">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold text-white">{s.value}</p>
                <p className="text-sm text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Compatible with</p>
            {partners.map((bank) => (
              <span key={bank} className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">{bank}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">Why International Credit Unions</p>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything you need to bank better</h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">Built from the ground up with security, speed, and simplicity as core principles.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card p-8 hover:shadow-card-hover transition-shadow duration-300">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${f.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">{f.desc}</p>
                <ul className="space-y-2.5">
                  {f.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-emerald-300" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section id="security" className="py-20 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">Enterprise Security</p>
              <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
                Your money is protected by military-grade security
              </h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                We use the same encryption and security protocols trusted by Fortune 500 companies. Your data and money are always protected.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Lock, label: 'AES-256 Encryption at rest and in transit' },
                  { icon: Shield, label: 'FDIC Insured up to $250,000 per depositor' },
                  { icon: RefreshCw, label: '24/7 fraud monitoring and real-time alerts' },
                  { icon: Users, label: 'Two-Factor Authentication (2FA) support' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="text-slate-300 text-sm font-medium">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Response Time', value: '< 2 min', sub: 'Avg. support response', icon: Phone },
                { label: 'Uptime SLA', value: '99.99%', sub: 'Infrastructure guarantee', icon: Zap },
                { label: 'Insured', value: '$250K', sub: 'FDIC per depositor', icon: Shield },
                { label: 'Encryption', value: 'AES-256', sub: 'Military-grade standard', icon: Lock },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <Icon className="w-5 h-5 text-blue-400 mb-3" />
                    <p className="text-2xl font-bold text-white">{item.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{item.sub}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">Crypto Wallet</p>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Buy, sell, and hold crypto</h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">Integrated Bitcoin wallet right inside your banking dashboard. No separate apps needed.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {cryptos.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.name} className="card p-6 flex items-center gap-4 hover:shadow-card-hover transition-shadow">
                <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center ${c.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-sm text-slate-400">{c.symbol}</p>
                </div>
                <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">{c.change}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <p className="text-center text-slate-500 text-sm mt-3">Rated 4.9/5 from over 50,000 reviews</p>
        </div>
      </section>

      <section id="faq" className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-4xl font-bold text-slate-900">Common questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-card"
              >
                <button
                  className="flex items-center justify-between w-full px-6 py-5 text-left font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-slate-500 text-sm leading-relaxed border-t border-slate-100">
                    <div className="pt-4">{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-slate-900 to-primary-900 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
            </div>
            <div className="relative">
              <h2 className="text-4xl font-bold text-white mb-4">Ready to get started?</h2>
              <p className="text-slate-400 mb-8 text-lg">Open your free account in under 5 minutes. No fees. No minimums. No nonsense.</p>
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-base"
              >
                Open Free Account
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid sm:grid-cols-4 gap-8 mb-12">
            <div className="sm:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">International Credit Unions</span>
              </div>
              <p className="text-sm leading-relaxed">Free banking built for the modern world. Secure, fast, and always improving.</p>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-4">Product</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#security" className="hover:text-white transition-colors">Security</a></li>
                <li><button onClick={() => navigate('/register')} className="hover:text-white transition-colors">Open Account</button></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-4">Legal</p>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => navigate('/privacy-policy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => navigate('/terms-of-services')} className="hover:text-white transition-colors">Terms of Service</button></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-4">Support</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> support@usbanking.icu</li>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> 1-800-TIDI-BANK</li>
              </ul>
            </div>
          </div>
          <div className="divider pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs">© 2026 International Credit Unionization. All rights reserved.<a href="/admin/login"> Global Credit Union</a></p>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs">Empowering a Global Supply Chain</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
