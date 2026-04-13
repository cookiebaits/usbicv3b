import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

const sections = [
  {
    title: '1. Information We Collect',
    content: 'We collect information you provide directly, including name, email, phone number, Social Security Number, and address when you register. We also collect transaction data, device information, and usage analytics to improve our services and comply with banking regulations.',
  },
  {
    title: '2. How We Use Your Information',
    content: 'Your information is used to create and manage your accounts, process transactions, verify your identity, prevent fraud, comply with legal obligations, provide customer support, and improve our platform. We do not sell your personal information to third parties.',
  },
  {
    title: '3. Data Security',
    content: 'We implement industry-standard AES-256 encryption for all data at rest and in transit. Access to sensitive data is restricted to authorized personnel only. We conduct regular security audits and maintain compliance with applicable banking security standards.',
  },
  {
    title: '4. Information Sharing',
    content: 'We may share your information with banking partners, payment processors, and regulatory authorities as required by law. We may also share data with service providers who assist us in operating our platform under strict confidentiality agreements.',
  },
  {
    title: '5. Your Rights',
    content: 'You have the right to access, correct, or delete your personal information. You may also request data portability or restrict certain processing activities. To exercise these rights, contact our support team at support@securebank.io.',
  },
  {
    title: '6. Cookies',
    content: 'We use essential cookies to maintain your session and security. We also use analytics cookies to understand how users interact with our platform. You may disable non-essential cookies in your browser settings.',
  },
  {
    title: '7. Data Retention',
    content: 'We retain your data as long as your account is active or as required by law. Banking regulations require us to maintain transaction records for a minimum of seven years. Upon account closure, we will delete your data subject to legal retention requirements.',
  },
  {
    title: '8. Changes to This Policy',
    content: 'We may update this policy from time to time. We will notify you of material changes via email or through our platform. Continued use of our services after changes indicates your acceptance of the updated policy.',
  },
];

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-900">SecureBank</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Privacy Policy</h1>
          <p className="text-slate-500">Last updated: January 1, 2024</p>
        </div>

        <div className="card p-8 space-y-8">
          <p className="text-slate-600 leading-relaxed">
            At SecureBank, your privacy is our priority. This Privacy Policy explains how we collect, use, and protect your personal information when you use our banking services.
          </p>

          {sections.map((section) => (
            <div key={section.title} className="border-t border-slate-100 pt-8">
              <h2 className="text-lg font-bold text-slate-900 mb-3">{section.title}</h2>
              <p className="text-slate-600 leading-relaxed text-sm">{section.content}</p>
            </div>
          ))}

          <div className="border-t border-slate-100 pt-8">
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Contact Us</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              If you have questions about this Privacy Policy or how we handle your data, please contact us at{' '}
              <a href="mailto:privacy@securebank.io" className="text-primary-600 hover:text-primary-700 font-medium">privacy@securebank.io</a>{' '}
              or write to us at SecureBank Privacy Team, 123 Financial District, New York, NY 10004.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
