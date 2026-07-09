// Premium Design System for SmartSpend React Native

export const theme = {
  colors: {
    // Brand Foundation
    background: '#FFFFFF',
    surface: '#FCFCFD',
    surfaceElevated: '#F8FAFC',
    
    // Primary Accents (Blue #2D8CFF) — 15-20% of UI
    primary: '#2D8CFF',
    primaryHover: '#1D7AF0',
    primaryPressed: '#1668D8',
    primaryGlow: 'rgba(45, 140, 255, 0.4)',
    
    // Blue Shades (Derived from #2D8CFF)
    primary50: '#EFF6FF',
    primary100: '#DBEAFE',
    primary200: '#BFDBFE',
    primary500: '#2D8CFF',
    primary600: '#1D7AF0',
    primary700: '#1668D8',
    
    // Accent (Orange #F26D21) — ~5% of UI
    accent: '#F26D21',
    accentBg: 'rgba(242, 109, 33, 0.1)',
    secondary: '#F26D21',
    
    // Status & Semantic
    success: '#16A34A',
    successBg: 'rgba(22, 163, 74, 0.1)',
    warning: '#F26D21',
    warningBg: 'rgba(242, 109, 33, 0.1)',
    danger: '#DC2626',
    dangerBg: 'rgba(220, 38, 38, 0.1)',
    info: '#2D8CFF',
    infoBg: 'rgba(45, 140, 255, 0.1)',
    
    // Typography
    textPrimary: '#232333',
    textSecondary: '#747487',
    textTertiary: '#94A3B8',
    
    // UI Elements
    border: 'rgba(116, 116, 135, 0.2)',
    borderFocus: 'rgba(45, 140, 255, 0.5)',
  },
  
  gradients: {
    primary: ['#2D8CFF', '#1D7AF0'],
    accent: ['#F26D21', '#E05A10'],
    success: ['#16A34A', '#15803D'],
    card: ['#FFFFFF', '#FCFCFD'],
  },
  
  typography: {
    h1: { fontSize: 32, fontWeight: '700', color: '#232333', letterSpacing: -0.5 },
    h2: { fontSize: 24, fontWeight: '600', color: '#232333', letterSpacing: -0.5 },
    h3: { fontSize: 20, fontWeight: '600', color: '#232333' },
    body: { fontSize: 16, color: '#747487' },
    caption: { fontSize: 13, color: '#747487' },
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
