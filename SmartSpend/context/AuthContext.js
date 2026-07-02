import React, { createContext, useState, useEffect, useContext } from 'react';
import { api, saveTokens, clearTokens, getTokens } from '../utils/api';
import { useAppConfig } from './AppConfigContext';

export const AuthContext = createContext();

// Inner provider that wires up to AppConfigContext
function AuthProviderInner({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { registerRefreshUser } = useAppConfig();

  // Fetch fresh user with plan.features from /auth/me
  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data);
      return res.data.data;
    } catch (e) {
      console.log('Refresh user error', e);
      return null;
    }
  };

  // Register refreshUser with AppConfigContext so it can be called on every poll
  useEffect(() => {
    registerRefreshUser(refreshUser);
  }, [registerRefreshUser]);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { accessToken } = await getTokens();
        if (accessToken) {
          // /auth/me always returns full plan.features
          await refreshUser();
        }
      } catch (e) {
        // Token invalid or network error
        console.log('Check auth error', e.message);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (emailOrPhone, password) => {
    const res = await api.post('/auth/login', { emailOrPhone, password, deviceName: 'MobileApp' });
    const { accessToken, refreshToken, user: userData } = res.data.data;
    await saveTokens(accessToken, refreshToken);
    // Set basic user data immediately for fast UI
    setUser(userData);
    // Fetch full user with plan features
    refreshUser().catch(() => {});
    return res.data.data;
  };

  const register = async (fullName, email, phone, password) => {
    const payload = { fullName, email, password };
    if (phone) payload.phone = phone;
    const res = await api.post('/auth/register', payload);
    return res.data.data;
  };

  const verifyOtp = async (email, otp, purpose) => {
    const endpoint = purpose === 'password_reset' ? '/auth/reset-password' : '/auth/verify-email';
    const res = await api.post(endpoint, { email, otp });
    return res.data.data;
  };

  const logout = async () => {
    try {
      const { refreshToken } = await getTokens();
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (e) {
      console.log('Logout error', e.message);
    } finally {
      await clearTokens();
      setUser(null);
    }
  };

  const forgotPassword = async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data.data;
  };

  const updateProfileInContext = (newData) => {
    setUser((prev) => ({ ...prev, ...newData }));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, verifyOtp, forgotPassword, logout, updateProfileInContext, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Outer wrapper — AppConfigProvider must already be in the tree
export const AuthProvider = ({ children }) => {
  return <AuthProviderInner>{children}</AuthProviderInner>;
};

// Convenience hook
export const useAuth = () => useContext(AuthContext);
