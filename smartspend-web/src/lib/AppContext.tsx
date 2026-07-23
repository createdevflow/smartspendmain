'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from './api';

interface AppConfig {
  maintenanceMode: boolean;
  features: Record<string, boolean>;
  [key: string]: unknown;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  plan: any;
  role: string;
  avatar?: string;
  currency?: string;
  unreadNotifications?: number;
  createdAt?: string;
  isEmailVerified?: boolean;
}

interface AppContextType {
  user: User | null;
  appConfig: AppConfig | null;
  loading: boolean;
  isFeatureEnabled: (key: string) => boolean;
  refreshUser: () => Promise<void>;
  activeCashbookId: string | null;
  setActiveCashbookId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType>({
  user: null,
  appConfig: null,
  loading: true,
  isFeatureEnabled: () => true,
  refreshUser: async () => {},
  activeCashbookId: null,
  setActiveCashbookId: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCashbookId, setActiveCashbookIdState] = useState<string | null>(null);

  const setActiveCashbookId = (id: string | null) => {
    setActiveCashbookIdState(id);
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem('activeCashbookId', id);
      else localStorage.removeItem('activeCashbookId');
    }
  };

  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/me');
      const u = res.data?.data || res.data;
      // also fetch unread count
      const notifRes = await api.get('/notifications/unread-count').catch(() => ({ data: { data: 0 } }));
      setUser({ ...u, unreadNotifications: notifRes.data?.data ?? 0 });
    } catch {
      setUser(null);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await api.get('/app-config/public');
      setAppConfig(res.data?.data || res.data);
    } catch {
      setAppConfig(null);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const savedCb = typeof window !== 'undefined' ? localStorage.getItem('activeCashbookId') : null;
    if (savedCb) setActiveCashbookIdState(savedCb);
    
    if (token) {
      Promise.all([fetchUser(), fetchConfig()]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const isFeatureEnabled = (key: string): boolean => {
    if (!appConfig) return true;
    const features = appConfig.features || {};
    return features[key] !== false;
  };

  return (
    <AppContext.Provider value={{ user, appConfig, loading, isFeatureEnabled, refreshUser: fetchUser, activeCashbookId, setActiveCashbookId }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
