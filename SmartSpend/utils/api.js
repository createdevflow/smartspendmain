import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Derive the API host from the same server Expo Metro is running on.
// This means: in tunnel mode → tunnel URL, in LAN mode → local IP, in prod → EXPO_PUBLIC_API_URL.
const getApiUrl = () => {
  // 1. Explicit override (production / EAS builds)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // 2. Dynamic Detection for Web
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `http://${window.location.hostname}:3000/api/v1`;
  }
  
  // 3. Auto-detect from Expo Metro host (works for tunnel, LAN, localhost)
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost; 
  if (hostUri) {
    const host = hostUri.split(':')[0]; // strip port
    const scheme = hostUri.includes('exp.host') ? 'https' : 'http';
    return `${scheme}://${host}:3000/api/v1`;
  }
  
  // 4. Final fallback
  return 'http://localhost:3000/api/v1';
};

const API_URL = getApiUrl();
console.log('[API] Connecting to:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Helper to get tokens
export const getTokens = async () => {
  try {
    const accessToken = await SecureStore.getItemAsync('accessToken');
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    return { accessToken, refreshToken };
  } catch (error) {
    return { accessToken: null, refreshToken: null };
  }
};

// Helper to save tokens
export const saveTokens = async (accessToken, refreshToken) => {
  if (accessToken) await SecureStore.setItemAsync('accessToken', String(accessToken));
  if (refreshToken) await SecureStore.setItemAsync('refreshToken', String(refreshToken));
};

// Helper to clear tokens
export const clearTokens = async () => {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
};

// Request Interceptor
api.interceptors.request.use(
  async (config) => {
    const { accessToken } = await getTokens();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and not a retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const { refreshToken } = await getTokens();
        if (!refreshToken) throw new Error('No refresh token');

        // Attempt refresh
        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data.data || res.data;
        
        await saveTokens(accessToken, newRefresh);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await clearTokens();
        // Redirect to login handled by AuthContext
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
