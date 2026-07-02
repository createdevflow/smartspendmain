// components/chat/FinancialShareCard.js
// Rich financial preview cards — all wired to real onViewPress/onOpenPress
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import VoicePlayer from './VoicePlayer';

const CURRENCY = '₹';
const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

function ProgressBar({ value, max, color = '#1D4ED8' }) {
  const pct = Math.min((value / Math.max(max, 1)) * 100, 100);
  return (
    <View style={pb.bar}>
      <View style={[pb.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}
const pb = StyleSheet.create({
  bar: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  fill: { height: 6, borderRadius: 3 },
});

// ── Transaction / Receipt Card ────────────────────────────────────────────────
function TransactionFinCard({ metadata, onViewPress, isReceipt }) {
  const isIncome = metadata?.type === 'INCOME';
  const amount = fmt(metadata?.amount);
  const date = metadata?.date
    ? new Date(metadata.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';
  const accentColor = isReceipt ? '#D97706' : (isIncome ? '#10B981' : '#EF4444');

  return (
    <View style={[s.card, { borderLeftColor: accentColor, borderLeftWidth: 4 }]}>
      <View style={s.cardRow}>
        <View style={[s.iconBg, { backgroundColor: isReceipt ? '#FEF3C7' : (isIncome ? '#D1FAE5' : '#FEE2E2') }]}>
          <Feather
            name={isReceipt ? 'file-text' : (isIncome ? 'arrow-down-left' : 'arrow-up-right')}
            size={18}
            color={accentColor}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.cardLabel}>
            {isReceipt
              ? (metadata?.notes || metadata?.category || 'Transaction Receipt')
              : (metadata?.category || (isIncome ? 'Income' : 'Expense'))}
          </Text>
          <Text style={s.cardSub}>{metadata?.cashbookName || 'Cashbook'} • {date}</Text>
        </View>
        <Text style={[s.cardAmount, { color: accentColor }]}>
          {isIncome ? '+' : '-'}{CURRENCY}{amount}
        </Text>
      </View>
      {metadata?.notes && !isReceipt ? (
        <Text style={s.cardNote} numberOfLines={1}>{metadata.notes}</Text>
      ) : null}
      {isReceipt && metadata?.notes ? (
        <Text style={s.cardNote} numberOfLines={1}>Note: {metadata.notes}</Text>
      ) : null}
      <TouchableOpacity style={s.viewBtn} onPress={onViewPress} activeOpacity={0.7}>
        <Feather name={isReceipt ? 'eye' : 'external-link'} size={12} color={accentColor} />
        <Text style={[s.viewBtnText, { color: accentColor }]}>
          {isReceipt ? 'View Receipt' : 'View Transaction'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Budget Card ───────────────────────────────────────────────────────────────
function BudgetFinCard({ metadata, onViewPress }) {
  const spent = Number(metadata?.spent || 0);
  const limit = Number(metadata?.limit || 1);
  const pct = Math.round((spent / limit) * 100);
  const over = spent > limit;
  const remaining = limit - spent;

  return (
    <View style={[s.card, { borderLeftColor: '#6366F1', borderLeftWidth: 4 }]}>
      <View style={s.cardRow}>
        <View style={[s.iconBg, { backgroundColor: '#EDE9FE' }]}>
          <Feather name="bar-chart-2" size={18} color="#6366F1" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.cardLabel}>{metadata?.name || 'Budget'}</Text>
          <Text style={s.cardSub}>{metadata?.period || 'Monthly'} · {metadata?.cashbookName || ''}</Text>
        </View>
        <View style={[s.pctBadge, { backgroundColor: over ? '#FEE2E2' : '#EDE9FE' }]}>
          <Text style={[s.pctText, { color: over ? '#DC2626' : '#6366F1' }]}>{pct}%</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        <Text style={s.cardNote}>Spent: <Text style={{ color: over ? '#DC2626' : '#374151', fontWeight: '700' }}>{CURRENCY}{fmt(spent)}</Text></Text>
        <Text style={s.cardNote}>Limit: <Text style={{ color: '#374151', fontWeight: '700' }}>{CURRENCY}{fmt(limit)}</Text></Text>
      </View>
      <ProgressBar value={spent} max={limit} color={over ? '#EF4444' : '#6366F1'} />
      <Text style={[s.cardNote, { color: over ? '#DC2626' : '#059669', marginTop: 6 }]}>
        {over ? `⚠️ Over budget by ${CURRENCY}${fmt(Math.abs(remaining))}` : `${CURRENCY}${fmt(remaining)} remaining`}
      </Text>
    </View>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────
function GoalFinCard({ metadata, onViewPress }) {
  const current = Number(metadata?.current || metadata?.currentAmount || 0);
  const target = Number(metadata?.target || metadata?.targetAmount || 1);
  const pct = Math.round((current / target) * 100);
  const toGo = target - current;

  return (
    <View style={[s.card, { borderLeftColor: '#0EA5E9', borderLeftWidth: 4 }]}>
      <View style={s.cardRow}>
        <View style={[s.iconBg, { backgroundColor: '#E0F2FE' }]}>
          <Text style={{ fontSize: 18 }}>{metadata?.emoji || '🎯'}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.cardLabel}>{metadata?.name || 'Goal'}</Text>
          <Text style={s.cardSub}>Target: {CURRENCY}{fmt(target)}</Text>
        </View>
        <View style={[s.pctBadge, { backgroundColor: pct >= 100 ? '#D1FAE5' : '#EFF6FF' }]}>
          <Text style={[s.pctText, { color: pct >= 100 ? '#059669' : '#1D4ED8' }]}>{pct}%</Text>
        </View>
      </View>
      <ProgressBar value={current} max={target} color="#0EA5E9" />
      <Text style={s.cardNote}>
        {pct >= 100
          ? '🎉 Goal achieved!'
          : `${CURRENCY}${fmt(current)} saved · ${CURRENCY}${fmt(toGo)} to go`}
      </Text>
      {metadata?.deadline && (
        <Text style={[s.cardNote, { color: '#6B7280' }]}>
          🗓 Deadline: {new Date(metadata.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Text>
      )}
    </View>
  );
}

// ── Monthly Report Card ───────────────────────────────────────────────────────
function ReportFinCard({ metadata, onViewPress }) {
  const income = Number(metadata?.totalIncome || 0);
  const expense = Number(metadata?.totalExpense || 0);
  const net = Number(metadata?.net ?? (income - expense));
  const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;

  return (
    <View style={[s.card, { borderLeftColor: '#F59E0B', borderLeftWidth: 4 }]}>
      <View style={s.cardRow}>
        <View style={[s.iconBg, { backgroundColor: '#FEF3C7' }]}>
          <Feather name="pie-chart" size={18} color="#D97706" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.cardLabel}>{metadata?.title || 'Monthly Report'}</Text>
          <Text style={s.cardSub}>{metadata?.month || ''}{metadata?.cashbookName ? ` · ${metadata.cashbookName}` : ''}</Text>
        </View>
        {savingsRate > 0 && (
          <View style={[s.pctBadge, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[s.pctText, { color: '#059669' }]}>{savingsRate}% saved</Text>
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 12, gap: 0 }}>
        <View style={s.reportStat}>
          <Text style={s.reportStatLabel}>Income</Text>
          <Text style={[s.reportStatValue, { color: '#059669' }]}>{CURRENCY}{fmt(income)}</Text>
        </View>
        <View style={[s.reportDivider]} />
        <View style={s.reportStat}>
          <Text style={s.reportStatLabel}>Expense</Text>
          <Text style={[s.reportStatValue, { color: '#DC2626' }]}>{CURRENCY}{fmt(expense)}</Text>
        </View>
        <View style={[s.reportDivider]} />
        <View style={s.reportStat}>
          <Text style={s.reportStatLabel}>Net</Text>
          <Text style={[s.reportStatValue, { color: net >= 0 ? '#1D4ED8' : '#DC2626' }]}>
            {net >= 0 ? '+' : ''}{CURRENCY}{fmt(Math.abs(net))}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Document Card ─────────────────────────────────────────────────────────────
function DocumentFinCard({ metadata, onViewPress }) {
  const ext = (metadata?.filename || '').split('.').pop()?.toUpperCase() || 'FILE';
  const extColors = { PDF: '#DC2626', DOC: '#2563EB', DOCX: '#2563EB', XLS: '#059669', XLSX: '#059669', PNG: '#7C3AED', JPG: '#D97706' };
  const extColor = extColors[ext] || '#4F46E5';

  return (
    <View style={[s.card, { borderLeftColor: extColor, borderLeftWidth: 4 }]}>
      <View style={s.cardRow}>
        <View style={[s.iconBg, { backgroundColor: '#E0E7FF' }]}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: extColor }}>{ext}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.cardLabel} numberOfLines={1}>{metadata?.filename || metadata?.title || 'Document'}</Text>
          <Text style={s.cardSub}>
            {metadata?.size || ''}
            {metadata?.pages ? ` · ${metadata.pages} pages` : ''}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={s.viewBtn} onPress={onViewPress} activeOpacity={0.7}>
        <Feather name="download" size={12} color="#4F46E5" />
        <Text style={[s.viewBtnText, { color: '#4F46E5' }]}>Open Document</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Voice Card (playable) ─────────────────────────────────────────────────────
function VoiceFinCard({ metadata, isOwn }) {
  const uri = metadata?.uri || null;
  const durationSec = metadata?.durationSec || 0;

  return (
    <View style={{ paddingTop: 2 }}>
      <VoicePlayer uri={uri} duration={durationSec} isOwn={isOwn} />
    </View>
  );
}

// ── Master export ─────────────────────────────────────────────────────────────
export default function FinancialShareCard({ type, metadata, onViewPress, isOwn }) {
  const cardType = (type || metadata?.cardType || 'TRANSACTION').toUpperCase();

  switch (cardType) {
    case 'BUDGET':
      return <BudgetFinCard metadata={metadata} onViewPress={onViewPress} />;
    case 'GOAL':
      return <GoalFinCard metadata={metadata} onViewPress={onViewPress} />;
    case 'REPORT':
      return <ReportFinCard metadata={metadata} onViewPress={onViewPress} />;
    case 'DOCUMENT':
      return <DocumentFinCard metadata={metadata} onViewPress={onViewPress} />;
    case 'VOICE':
      return <VoiceFinCard metadata={metadata} isOwn={isOwn} />;
    case 'RECEIPT':
      return <TransactionFinCard metadata={metadata} onViewPress={onViewPress} isReceipt />;
    default:
      // TRANSACTION and all unknown
      return <TransactionFinCard metadata={metadata} onViewPress={onViewPress} isReceipt={false} />;
  }
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14, padding: 14,
    minWidth: 240, maxWidth: 300,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  cardSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardAmount: { fontSize: 16, fontWeight: '800', color: '#111827' },
  cardNote: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  pctBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  pctText: { fontSize: 12, fontWeight: '700' },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 10, borderTopWidth: 0.5, borderTopColor: '#E5E7EB', paddingTop: 8,
  },
  viewBtnText: { fontSize: 12, fontWeight: '600', color: '#1D4ED8' },
  // Report specific
  reportStat: { flex: 1, alignItems: 'center' },
  reportStatLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 3 },
  reportStatValue: { fontSize: 14, fontWeight: '800' },
  reportDivider: { width: 0.5, backgroundColor: '#E5E7EB', marginHorizontal: 4 },
});
