// components/invoice/InvoiceStatusBadge.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_META } from '../../context/InvoiceContext';

export default function InvoiceStatusBadge({ status, size = 'md' }) {
  const meta = STATUS_META[status] || STATUS_META['DRAFT'];
  const isSmall = size === 'sm';

  return (
    <View style={[
      styles.badge,
      { backgroundColor: meta.bg },
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
