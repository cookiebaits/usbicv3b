import React, { createContext, useContext, useState, useEffect } from 'react';

interface Settings {
  siteName: string;
  supportEmail: string;
  supportPhone: string;
  primaryColor: string;
  primaryFontColor: string;
  secondaryColor: string;
  siteLogo: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  refreshSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: Settings = {
  siteName: 'SecureBank',
  supportEmail: 'support@securebank.io',
  supportPhone: '1-800-SECURE-1',
  primaryColor: '#2563EB',
  primaryFontColor: '#FFFFFF',
  secondaryColor: '#1E293B',
  siteLogo: '',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const refreshSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };


  useEffect(() => {
    refreshSettings();
  }, []);

  useEffect(() => {
    if (settings.siteName) {
      document.title = settings.siteName;
    }
    if (settings.primaryColor) {
      document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
    }
  }, [settings.siteName, settings.primaryColor]);


  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
