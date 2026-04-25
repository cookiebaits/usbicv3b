import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe, Palette, Loader2, Check, AlertCircle, Save,
  Upload, X, Mail, Phone, Instagram, Twitter, Facebook, Shield,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

type SettingsTab = 'general' | 'appearance' | 'security';

interface Settings {
  siteName: string;
  supportEmail: string;
  supportPhone: string;
  instagramUrl: string;
  twitterUrl: string;
  facebookUrl: string;
  primaryColor: string;
  primaryFontColor: string;
  secondaryColor: string;
  privacyPolicy: string;
  termsOfService: string;
  siteLogo: string;
  zelleLogo: string;
  twoFALogo: string;
  adminUsername?: string;
  adminPassword?: string;
}

const DEFAULT_SETTINGS: Settings = {
  siteName: 'SecureBank',
  supportEmail: 'support@securebank.io',
  supportPhone: '1-800-SECURE-1',
  instagramUrl: '',
  twitterUrl: '',
  facebookUrl: '',
  primaryColor: '#2563EB',
  primaryFontColor: '#FFFFFF',
  secondaryColor: '#1E293B',
  privacyPolicy: '',
  termsOfService: '',
  siteLogo: '',
  zelleLogo: '',
  twoFALogo: '',
};

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const adminFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(options.headers as Record<string, string>) },
      credentials: 'include',
    });
    if (res.status === 401 || res.status === 403) { navigate('/admin/login'); throw new Error('Unauthorized'); }
    if (res.status === 404) return null;
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Failed'); }
    return res.json();
  }, [navigate]);

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { navigate('/admin/login'); return; }
    adminFetch('/api/admin/settings').then((data) => {
      if (data) setSettings({ ...DEFAULT_SETTINGS, ...data });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [navigate, adminFetch]);

  const showMsg = (msg: string, isErr = false) => {
    if (isErr) { setError(msg); setSuccess(''); } else { setSuccess(msg); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminFetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify(settings) });
      showMsg('Settings saved successfully');
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed to save settings.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (field: keyof Settings, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSettings((prev) => ({ ...prev, [field]: result }));
    };
    reader.readAsDataURL(file);
  };

  const update = (field: keyof Settings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  if (loading) {
    return (
      <AdminLayout title="Settings">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage site configuration and appearance</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm">
            <AlertCircle className="w-4 h-4" /><span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl p-4 text-sm">
            <Check className="w-4 h-4" /><span>{success}</span>
          </div>
        )}

        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSave}>
          {tab === 'general' && (
            <div className="space-y-6">
              <div className="card p-6 space-y-5">
                <h2 className="font-semibold text-slate-900">Site Information</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Site Name</label>
                    <input className="input-field" value={settings.siteName} onChange={(e) => update('siteName', e.target.value)} placeholder="SecureBank" />
                  </div>
                  <div>
                    <label className="input-label">Support Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input className="input-field pl-10" type="email" value={settings.supportEmail} onChange={(e) => update('supportEmail', e.target.value)} placeholder="support@example.com" />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Support Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input className="input-field pl-10" value={settings.supportPhone} onChange={(e) => update('supportPhone', e.target.value)} placeholder="1-800-000-0000" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-6 space-y-5">
                <h2 className="font-semibold text-slate-900">Social Media</h2>
                <div className="space-y-4">
                  {[
                    { field: 'instagramUrl' as keyof Settings, label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/...' },
                    { field: 'twitterUrl' as keyof Settings, label: 'Twitter / X', icon: Twitter, placeholder: 'https://twitter.com/...' },
                    { field: 'facebookUrl' as keyof Settings, label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/...' },
                  ].map((s) => {
                    const Icon = s.icon;
                    return (
                      <div key={s.field}>
                        <label className="input-label">{s.label}</label>
                        <div className="relative">
                          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input className="input-field pl-10" value={settings[s.field] as string} onChange={(e) => update(s.field, e.target.value)} placeholder={s.placeholder} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card p-6 space-y-5">
                <h2 className="font-semibold text-slate-900">Legal Content</h2>
                <div>
                  <label className="input-label">Privacy Policy (HTML or plain text)</label>
                  <textarea className="input-field min-h-32 resize-y" value={settings.privacyPolicy} onChange={(e) => update('privacyPolicy', e.target.value)} placeholder="Enter privacy policy content..." />
                </div>
                <div>
                  <label className="input-label">Terms of Service (HTML or plain text)</label>
                  <textarea className="input-field min-h-32 resize-y" value={settings.termsOfService} onChange={(e) => update('termsOfService', e.target.value)} placeholder="Enter terms of service content..." />
                </div>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="space-y-6">
              <div className="card p-6 space-y-5">
                <h2 className="font-semibold text-slate-900">Admin Credentials</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Admin Username</label>
                    <input
                      className="input-field"
                      value={settings.adminUsername || ''}
                      onChange={(e) => update('adminUsername', e.target.value)}
                      placeholder="Admin"
                    />
                  </div>
                  <div>
                    <label className="input-label">New Admin Password</label>
                    <input
                      className="input-field"
                      type="password"
                      value={settings.adminPassword || ''}
                      onChange={(e) => update('adminPassword', e.target.value)}
                      placeholder="Leave blank to keep current"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400">These credentials are used to access the admin portal.</p>
              </div>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="space-y-6">
              <div className="card p-6 space-y-5">
                <h2 className="font-semibold text-slate-900">Colors</h2>
                <div className="grid sm:grid-cols-3 gap-6">
                  {[
                    { field: 'primaryColor' as keyof Settings, label: 'Primary Color', desc: 'Button & accent color' },
                    { field: 'primaryFontColor' as keyof Settings, label: 'Primary Font Color', desc: 'Text on primary buttons' },
                    { field: 'secondaryColor' as keyof Settings, label: 'Secondary Color', desc: 'Top bar & navigation' },
                  ].map((c) => (
                    <div key={c.field}>
                      <label className="input-label">{c.label}</label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="color"
                            value={settings[c.field] as string}
                            onChange={(e) => update(c.field, e.target.value)}
                            className="w-12 h-10 rounded-xl border border-slate-200 cursor-pointer p-1"
                          />
                        </div>
                        <input
                          className="input-field font-mono text-sm flex-1"
                          value={settings[c.field] as string}
                          onChange={(e) => update(c.field, e.target.value)}
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{c.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-600 font-medium">Preview:</span>
                  <button
                    type="button"
                    style={{ backgroundColor: settings.primaryColor, color: settings.primaryFontColor }}
                    className="px-5 py-2 rounded-xl font-semibold text-sm transition-all"
                  >
                    Primary Button
                  </button>
                  <div
                    style={{ backgroundColor: settings.secondaryColor }}
                    className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
                  >
                    Navigation
                  </div>
                </div>
              </div>

              <div className="card p-6 space-y-5">
                <h2 className="font-semibold text-slate-900">Logos & Images</h2>
                <div className="grid sm:grid-cols-3 gap-6">
                  {[
                    { field: 'siteLogo' as keyof Settings, label: 'Site Logo', desc: 'Main site logo' },
                    { field: 'zelleLogo' as keyof Settings, label: 'Zelle Logo', desc: 'Shown in transfer sections' },
                    { field: 'twoFALogo' as keyof Settings, label: '2FA Logo', desc: 'Shown during verification' },
                  ].map((l) => (
                    <div key={l.field}>
                      <label className="input-label">{l.label}</label>
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-primary-300 transition-colors">
                        {settings[l.field] ? (
                          <div className="relative group">
                            <img src={settings[l.field] as string} alt={l.label} className="max-h-16 mx-auto object-contain rounded-lg" />
                            <button
                              type="button"
                              onClick={() => update(l.field, '')}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => { if (e.target.files?.[0]) handleLogoUpload(l.field, e.target.files[0]); }}
                            />
                            <div className="flex flex-col items-center gap-2 py-2">
                              <Upload className="w-6 h-6 text-slate-400" />
                              <span className="text-xs text-slate-400">Upload image</span>
                            </div>
                          </label>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{l.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
