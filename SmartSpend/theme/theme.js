// Premium Design System for SmartSpend React Native

export const theme = {
  colors: {
    // Dark Theme Foundation
    background: '#0F172A',
    surface: '#1E293B',
    surfaceElevated: '#334155',
    
    // Primary Accents
    primary: '#3B82F6',
    primaryHover: '#2563EB',
    primaryGlow: 'rgba(59, 130, 246, 0.4)',
    
    // Secondary Accents
    secondary: '#8B5CF6',
    
    // Status
    success: '#10B981',
    successBg: 'rgba(16, 185, 129, 0.1)',
    warning: '#F59E0B',
    warningBg: 'rgba(245, 158, 11, 0.1)',
    danger: '#EF4444',
    dangerBg: 'rgba(239, 68, 68, 0.1)',
    
    // Typography
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    
    // UI Elements
    border: 'rgba(255, 255, 255, 0.1)',
    borderFocus: 'rgba(59, 130, 246, 0.5)',
  },
  
  gradients: {
    primary: ['#3B82F6', '#8B5CF6'],
    success: ['#10B981', '#059669'],
    card: ['rgba(30, 41, 59, 0.8)', 'rgba(30, 41, 59, 0.4)'],
  },
  
  typography: {
    h1: { fontSize: 32, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 },
    h2: { fontSize: 24, fontWeight: '600', color: '#FFFFFF', letterSpacing: -0.5 },
    h3: { fontSize: 20, fontWeight: '600', color: '#FFFFFF' },
    body: { fontSize: 16, color: '#94A3B8' },
    caption: { fontSize: 13, color: '#64748B' },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    glow: {
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 12,
    }
  }
};
