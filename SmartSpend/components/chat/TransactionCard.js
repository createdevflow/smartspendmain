// components/chat/TransactionCard.js — Compact Premium Shareable Transaction Card
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function TransactionCard({ metadata, onPress }) {
  let data = metadata;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch { return null; }
  }
  if (!data || typeof data !== 'object') return null;
  const { type, amount, currency, category, date, notes, cashbookName, status } = data;
  const isIncome = type === 'INCOME';
  const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : (currency || '₹');
  const accent = isIncome ? '#10B981' : '#EF4444';
  const bgIcon = isIncome ? '#D1FAE5' : '#FEE2E2';

  const dateStr = date
    ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    : '';

  const title = notes || category || (isIncome ? 'Income' : 'Expense');

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
      <View style={styles.card}>
        <LinearGradient
          colors={[isIncome ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 0.45, y: 0.5 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 14 }]}
        />
        {/* Top row: Icon + Title + Amount */}
        <View style={styles.mainRow}>
          <View style={[styles.iconBox, { backgroundColor: bgIcon }]}>
            <Feather
              name={isIncome ? 'arrow-down-left' : 'arrow-up-right'}
              size={16}
              color={accent}
            />
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <Text style={styles.subText} numberOfLines={1}>
              {cashbookName || 'Cashbook'} {dateStr ? `· ${dateStr}` : ''}
            </Text>
          </View>

          <View style={styles.amountCol}>
            <Text style={[styles.amountText, { color: accent }]}>
              {isIncome ? '+' : '-'}{sym}{Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>{status || 'Completed'}</Text>
            </View>
          </View>
        </View>

        {/* Optional Notes */}
        {notes && category && notes !== category && (
          <View style={styles.noteBox}>
            <Text style={styles.noteText} numberOfLines={1}>{notes}</Text>
          </View>
        )}

        {/* Footer actions */}
        <View style={styles.footer}>
          <View style={styles.brandChip}>
            <Feather name="shield" size={10} color="#3D5AFC" />
            <Text style={styles.brandText}>Cashtro Verified</Text>
          </View>
          <View style={styles.actionRow}>
            <Text style={styles.actionText}>Tap to View</Text>
            <Feather name="chevron-right" size={13} color="#6B7280" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    maxWidth: 275,
    minWidth: 230,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingTop: 10,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  infoCol: {
    flex: 1,
    marginRight: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  subText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 13,
    fontWeight: '800',
  },
  statusRow: {
    marginTop: 1,
  },
  statusText: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  noteBox: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#F3F4F6',
  },
  noteText: {
    fontSize: 11,
    color: '#4B5563',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#F3F4F6',
  },
  brandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  brandText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3D5AFC',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
});
