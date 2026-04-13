import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: 'By accessing or using SecureBank\'s services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use our services.',
  },
  {
    title: '2. Eligibility',
    content: 'You must be at least 18 years old and a legal resident of the United States to open an account. By registering, you confirm that the information you provide is accurate and complete. We reserve the right to verify your identity and refuse service.',
  },
  {
    title: '3. Account Responsibilities',
    content: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized access. You are responsible for all activities conducted through your account.',
  },
  {
    title: '4. Fees and Charges',
    content: 'Basic checking and savings accounts are provided free of charge with no monthly maintenance fees. Wire transfer fees and third-party charges may apply. We reserve the right to introduce new fees with 30 days advance notice.',
  },
  {
    title: '5. Prohibited Activities',
    content: 'You may not use our services for money laundering, fraud, illegal activities, or any purpose that violates applicable law. Accounts found to be involved in prohibited activities will be immediately suspended and reported to authorities.',
  },
  {
    title: '6. Cryptocurrency Services',
    content: 'Cryptocurrency transactions carry inherent risk. Values can fluctuate significantly. We are not responsible for losses due to market volatility. Cryptocurrency holdings are not FDIC insured. You assume full responsibility for all crypto transactions.',
  },
  {
    title: '7. Limitation of Liability',
    content: 'SecureBank is not liable for indirect, incidental, or consequential damages arising from your use of our services. Our total liability shall not exceed the fees paid by you in the three months preceding the claim.',
  },
  {
    title: '8. Termination',
    content: 'We may suspend or terminate your account at any time for violation of these terms or applicable law. You may close your account at any time by contacting support. Upon termination, all outstanding balances will be settled per applicable regulations.',
  },
  {
    title: '9. Governing Law',
    content: 'These terms are governed by the laws of the State of New York. Any disputes shall be resolved through binding arbitration in New York City, NY, except where prohibited by law.',
  },
];

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Terms of Service</h1>
          <p className="text-slate-500">Last updated: January 1, 2024</p>
        </div>

        <div className="card p-8 space-y-8">
          <p className="text-slate-600 leading-relaxed">
            These Terms of Service govern your use of SecureBank&apos;s banking platform and services. Please read these terms carefully before using our services.
          </p>

          {sections.map((section) => (
            <div key={section.title} className="border-t border-slate-100 pt-8">
              <h2 className="text-lg font-bold text-slate-900 mb-3">{section.title}</h2>
              <p className="text-slate-600 leading-relaxed text-sm">{section.content}</p>
            </div>
          ))}

          <div className="border-t border-slate-100 pt-8">
            <h2 className="text-lg font-bold text-slate-900 mb-3">10. Contact</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              For questions about these Terms of Service, contact us at{' '}
              <a href="mailto:legal@securebank.io" className="text-primary-600 hover:text-primary-700 font-medium">legal@securebank.io</a>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
