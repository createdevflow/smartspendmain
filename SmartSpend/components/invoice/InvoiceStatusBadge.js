// components/invoice/InvoiceStatusBadge.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_META } from '../../context/InvoiceContext';
import { useAppTheme } from '../../context/ThemeContext';

export default function InvoiceStatusBadge({ status, size = 'md' }) {
  const meta = STATUS_META[status] || STATUS_META['DRAFT'];
  const isSmall = size === 'sm';
  const { isDark } = useAppTheme();

  // Convert hex color to an rgba string for dark mode background
  const hexToRgba = (hex, alpha) => {
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
      c = hex.substring(1).split('');
      if(c.length== 3){
        c= [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c = '0x' + c.join('');
      return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
    return meta.bg;
  }

  const bgStyle = isDark ? { backgroundColor: hexToRgba(meta.color, 0.15) } : { backgroundColor: meta.bg };

  return (
    <View style={[
      styles.badge,
      bgStyle,
      isSmall && styles.badgeSm,
    ]}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Text style={[styles.label, { color: meta.color }, isSmall && styles.labelSm]}>
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeSm: { paddingHorizontal: 8, paddingVertical: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
  labelSm: { fontSize: 10 },
});
