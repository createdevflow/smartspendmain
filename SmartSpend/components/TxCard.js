import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getCatMeta } from '../utils/categories.js';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

import { useAppTheme } from '../context/ThemeContext';
import { maskCurrency } from '../context/TransactionsContext';

function hexToRgb(hex) {
  let c;
  if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
    c = hex.substring(1).split('');
    if(c.length== 3){
      c= [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return [(c>>16)&255, (c>>8)&255, c&255].join(',');
  }
  return '116, 116, 135'; // generic grey fallback
}

export default function TxCard({ t, onEdit, onDelete, onInvoice, onSchedule, currencySymbol, privateMode }) {
  const { isDark } = useAppTheme();
  const isIn = t.type === 'INCOME';
  const catName = t.merchant || t.category?.name || (isIn ? 'Income' : 'Expense');
  const meta = getCatMeta(catName);
  const amountRaw = parseFloat(t.amount || 0);
  const amountText = privateMode ? maskCurrency(amountRaw, currencySymbol, isIn ? '+' : '−') : `${isIn ? '+' : '−'}${currencySymbol}${amountRaw.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const gradientColor = isIn ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)';

  return (
    <View style={[styles.txCard, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }]}>
      <LinearGradient
        colors={[gradientColor, 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 0.45, y: 0.5 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
      />
      <View style={styles.txMain}>
        {/* Category chip + icon */}
        <View style={[styles.txEmojiBox, { backgroundColor: 'transparent' }]}>
          <Text style={styles.txEmoji}>{meta.emoji}</Text>
        </View>

        <View style={styles.txInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.txName, isDark && { color: '#F8FAFC' }]} numberOfLines={1}>{catName}</Text>
            {(t.receiptUrl || t.receiptKey) && (
              <TouchableOpacity
                onPress={() => Linking.openURL(t.receiptUrl || t.receiptKey)}
              >
                {String(t.receiptUrl || t.receiptKey).toLowerCase().endsWith('.pdf') ? (
                  <View style={{ backgroundColor: isDark ? 'rgba(45,140,255,0.2)' : '#EFF6FF', borderRadius: 4, padding: 4 }}>
                    <Feather name="file-text" size={14} color="#2D8CFF" />
                  </View>
                ) : (
                  <Image 
                    source={{ uri: t.receiptUrl || t.receiptKey }} 
                    style={{ width: 24, height: 24, borderRadius: 4, borderWidth: 1, borderColor: isDark ? '#334155' : '#E5E7EB', backgroundColor: isDark ? '#1E293B' : '#F3F4F6' }} 
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.txMeta, isDark && { color: '#94A3B8' }]}>
            {formatDate(t.date)} · {formatTime(t.date)}
            {t.paymentMethod ? ` · ${t.paymentMethod}` : ''}
          </Text>
          {(t.notes || t.encNotes) ? (
            <Text style={[styles.txNote, isDark && { color: '#64748B' }]} numberOfLines={1}>{t.notes || t.encNotes}</Text>
          ) : null}
          {t.isScheduled && (
            <Text style={[styles.txMeta, { color: '#38BDF8', marginTop: 4, fontWeight: '600' }]}>
              📅 Scheduled{t.scheduledAt ? ` for ${formatDate(t.scheduledAt)} ${formatTime(t.scheduledAt)}` : ''}
            </Text>
          )}
        </View>

        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: isIn ? (isDark ? '#4ADE80' : '#16A34A') : (isDark ? '#F87171' : '#DC2626') }]}>
            {amountText}
          </Text>
          {t.isGstApplied && t.gstRate > 0 && (
            <Text style={[styles.txGstBadge, isDark && { backgroundColor: 'rgba(45,140,255,0.2)', color: '#38BDF8' }]}>GST {t.gstRate}%</Text>
          )}
        </View>
      </View>

      {/* Action row */}
      <View style={[styles.txActions, isDark && { borderTopColor: 'rgba(255,255,255,0.08)' }]}>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          <View style={[styles.catTag, { backgroundColor: isDark ? `rgba(${hexToRgb(meta.color)},0.15)` : meta.bg }]}>
            <Text style={[styles.catTagText, { color: meta.color }]}>{catName}</Text>
          </View>
          {t.warrantyUntil && (
            <View style={[styles.catTag, { backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : '#FEF3C7' }]}>
              <Feather name="shield" size={10} color={isDark ? '#FBBF24' : '#B45309'} />
              <Text style={[styles.catTagText, { color: isDark ? '#FBBF24' : '#B45309' }]}>
                Warranty: {formatDate(t.warrantyUntil)}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={[styles.actionIcon]} onPress={() => onInvoice && onInvoice(t)}>
            <Feather name="file-text" size={15} color={isDark ? '#34D399' : '#059669'} />
          </TouchableOpacity>
          {onSchedule && (
            <TouchableOpacity style={[styles.actionIcon]} onPress={() => onSchedule(t)}>
              <Feather name="clock" size={15} color="#F26D21" />
            </TouchableOpacity>
          )}
          {onEdit && (
            <TouchableOpacity style={[styles.actionIcon]} onPress={() => onEdit(t)}>
              <Feather name="edit-2" size={15} color="#2D8CFF" />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={[styles.actionIcon]} onPress={() => onDelete(t.id)}>
              <Feather name="trash-2" size={15} color={isDark ? '#F87171' : '#DC2626'} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  txCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  txMain: { flexDirection: 'row', alignItems: 'center' },
  txEmojiBox: {
    width: 44, height: 44, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  txEmoji: { fontSize: 20 },
  txInfo: { flex: 1, marginRight: 12 },
  txName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  txMeta: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  txNote: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 16, fontWeight: '800' },
  txGstBadge: {
    marginTop: 4, fontSize: 10, fontWeight: '700', color: '#2D8CFF',
    backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, overflow: 'hidden',
  },
  recurringBadge: {
    marginTop: 4, fontSize: 10, fontWeight: '700', color: '#2D8CFF',
    backgroundColor: '#EFF6FF', alignSelf: 'flex-start', paddingHorizontal: 6,
    paddingVertical: 3, borderRadius: 4, overflow: 'hidden'
  },
  txActions: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  catTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  catTagText: { fontSize: 11, fontWeight: '700' },
  actionIcon: {
    paddingHorizontal: 8, paddingVertical: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  actionIconDanger: {},
  actionIconSchedule: {},
});
