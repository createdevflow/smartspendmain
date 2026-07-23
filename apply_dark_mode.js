const fs = require('fs');
const files = [
  'SmartSpend/screens/InvoiceScreen.js',
  'SmartSpend/screens/InvoiceSettingsScreen.js',
  'SmartSpend/screens/InvoiceCreateScreen.js'
];
files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log('Not found:', file);
    return;
  }
  let content = fs.readFileSync(file, 'utf8');

  // Change StyleSheet.create to getStyles
  content = content.replace(/const styles = StyleSheet.create\(\{/, 'const getStyles = (isDark) => StyleSheet.create({');

  // Import useAppTheme
  if (!content.includes('useAppTheme')) {
    content = content.replace(/(import .* from '@react-navigation\/native';)/, "$1\nimport { useAppTheme } from '../context/ThemeContext';");
  }

  // Inject useAppTheme in functional component
  const match = content.match(/export default function (\w+)\([^)]*\) \{/);
  if (match && !content.includes('const { isDark } = useAppTheme();')) {
    content = content.replace(match[0], match[0] + "\n  const { isDark } = useAppTheme();\n  const styles = React.useMemo(() => getStyles(isDark), [isDark]);");
  }

  // Basic color replacements
  content = content.replace(/backgroundColor: '#F1F1F6'/g, "backgroundColor: isDark ? '#0F172A' : '#F1F1F6'");
  content = content.replace(/backgroundColor: '#FFFFFF'/g, "backgroundColor: isDark ? '#1E293B' : '#FFFFFF'");
  content = content.replace(/backgroundColor: '#FEF3C7'/g, "backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#FEF3C7'");
  content = content.replace(/backgroundColor: '#DBEAFE'/g, "backgroundColor: isDark ? 'rgba(45,140,255,0.15)' : '#DBEAFE'");
  content = content.replace(/color: '#12131A'/g, "color: isDark ? '#F8FAFC' : '#12131A'");
  content = content.replace(/color: '#8A8D99'/g, "color: isDark ? '#94A3B8' : '#8A8D99'");
  content = content.replace(/color: '#747487'/g, "color: isDark ? '#94A3B8' : '#747487'");
  content = content.replace(/borderColor: '#E4E4EC'/g, "borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E4E4EC'");
  content = content.replace(/borderColor: '#FDE68A'/g, "borderColor: isDark ? 'rgba(245,158,11,0.3)' : '#FDE68A'");
  content = content.replace(/color: '#92400E'/g, "color: isDark ? '#FCD34D' : '#92400E'");
  
  // InvoiceSettingsScreen specific colors
  content = content.replace(/backgroundColor: '#F9FAFB'/g, "backgroundColor: isDark ? '#0F172A' : '#F9FAFB'");
  content = content.replace(/borderColor: '#E5E7EB'/g, "borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB'");
  content = content.replace(/color: '#111827'/g, "color: isDark ? '#F8FAFC' : '#111827'");
  content = content.replace(/color: '#374151'/g, "color: isDark ? '#F8FAFC' : '#374151'");
  content = content.replace(/color: '#4B5563'/g, "color: isDark ? '#94A3B8' : '#4B5563'");
  content = content.replace(/color: '#6B7280'/g, "color: isDark ? '#94A3B8' : '#6B7280'");
  content = content.replace(/color: '#9CA3AF'/g, "color: isDark ? '#64748B' : '#9CA3AF'");
  
  // InvoiceFormScreen specific colors
  content = content.replace(/backgroundColor: '#F0F4FF'/g, "backgroundColor: isDark ? '#0F172A' : '#F0F4FF'");

  fs.writeFileSync(file, content);
  console.log('Updated:', file);
});
