// components/chat/TransactionCard.js — Shareable transaction card inside chat
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const TYPE_CONFIG = {
  INCOME: { gradient: ['#059669', '#10B981'], icon: 'arrow-down-left', label: 'Income' },
  EXPENSE: { gradient: ['#DC2626', '#EF4444'], icon: 'arrow-up-right', label: 'Expense' },
};

export default function TransactionCard({ metadata, onPress }) {
  let data = metadata;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch { return null; }
  }
  if (!data || typeof data !== 'object') return null;
  const { type, amount, currency, category, date, notes, cashbookName } = data;
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.EXPENSE;
  const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : (currency || '₹');

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <LinearGradient
        colors={config.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Feather name={config.icon} size={16} color="#fff" />
          </View>
          <View>
            <Text style={styles.typeLabel}>{config.label}</Text>
            {cashbookName && <Text style={styles.cashbookName}>{cashbookName}</Text>}
          </View>
          <View style={styles.ssTag}>
            <Text style={styles.ssTagText}>Cashtro</Text>
          </View>
        </View>

        <Text style={styles.amount}>
          {type === 'EXPENSE' ? '-' : '+'}{sym}{Number(amount).toLocaleString('en-IN')}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {category ? `${category}` : 'Uncategorized'}
          </Text>
          <Text style={styles.footerText}>
            {date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
          </Text>
        </View>

        {notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesText} numberOfLines={2}>{notes}</Text>
          </View>
        ) : null}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    minWidth: 220,
    maxWidth: 280,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  cashbookName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 1,
  },
  ssTag: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ssTagText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  notesBox: {
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 8,
    padding: 8,
  },
  notesText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    lineHeight: 18,
  },
});
