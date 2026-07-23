// context/ThemeContext.js — Theme provider with System Default / Light / Dark modes
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';

const THEME_STORAGE_KEY = '@app_theme_preference_v1';

export const LightTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    background: '#F5F7FB',
    card: '#FFFFFF',
    text: '#232333',
    textSecondary: '#64748B',
    border: 'rgba(15, 23, 42, 0.06)',
    primary: '#2D8CFF',
    surface: '#F8FAFC',
    inputBg: '#F1F5F9',
    danger: '#DC2626',
    success: '#16A34A',
    warning: '#F59E0B',
  },
};

export const DarkTheme = {
  ...NavigationDarkTheme,
  dark: true,
  colors: {
    ...NavigationDarkTheme.colors,
    background: '#0F172A',
    card: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: 'rgba(255, 255, 255, 0.08)',
    primary: '#38BDF8',
    surface: '#0B1120',
    inputBg: '#334155',
    danger: '#EF4444',
    success: '#22C55E',
    warning: '#FBBF24',
  },
};

export const ThemeContext = createContext({
  themeMode: 'light',
  isDark: false,
  theme: LightTheme,
  setThemeMode: () => {},
});

export const useAppTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme(); // 'light' or 'dark'
  const [themeMode, setThemeModeState] = useState('light'); // 'light' (default) | 'dark' | 'system'
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved && ['system', 'light', 'dark'].includes(saved)) {
          setThemeModeState(saved);
        } else {
          setThemeModeState('light');
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setThemeMode = async (mode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      // Ignore storage error
    }
  };

  const isDark =
    themeMode === 'dark'
      ? true
      : themeMode === 'light'
      ? false
      : systemColorScheme === 'dark';

  const theme = isDark ? DarkTheme : LightTheme;

  return (
    <ThemeContext.Provider value={{ themeMode, isDark, theme, setThemeMode, loaded }}>
      {children}
    </ThemeContext.Provider>
  );
}
