// components/chat/FinancialShareCard.js
// Compact, Premium Financial & Document Previews (Receipts, Invoices, Documents, Budgets, Goals, Reports)
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
  bar: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden', marginTop: 6 },
  fill: { height: 4, borderRadius: 2 },
});

// ── Mini Receipt Card ─────────────────────────────────────────────────────────
function ReceiptFinCard({ metadata, onViewPress }) {
  const amount = fmt(metadata?.amount);
  const dateStr = metadata?.date
    ? new Date(metadata.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    : '';
  const title = metadata?.notes || metadata?.category || 'Receipt';

  return (
    <View style={s.card}>
      <View style={s.row}>
        <View style={[s.iconBox, { backgroundColor: '#FEF3C7' }]}>
          <Feather name="file-text" size={16} color="#D97706" />
        </View>
        <View style={s.info}>
          <Text style={s.title} numberOfLines={1}>{title}</Text>
          <Text style={s.sub}>{metadata?.cashbookName || 'Cashtro Receipt'} {dateStr ? `· ${dateStr}` : ''}</Text>
        </View>
        <Text style={[s.amt, { color: '#D97706' }]}>{CURRENCY}{amount}</Text>
      </View>

      <View style={s.actionsRow}>
        <TouchableOpacity style={s.iconAction} onPress={onViewPress}>
          <Feather name="eye" size={13} color="#4B5563" />
          <Text style={s.iconActionText}>View</Text>
        </TouchableOpacity>
        <View style={s.div} />
        <TouchableOpacity style={s.iconAction} onPress={onViewPress}>
          <Feather name="share-2" size={13} color="#4B5563" />
          <Text style={s.iconActionText}>Share</Text>
        </TouchableOpacity>
        <View style={s.div} />
        <TouchableOpacity style={s.iconAction} onPress={onViewPress}>
          <Feather name="download" size={13} color="#4B5563" />
          <Text style={s.iconActionText}>Download</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Mini Invoice Card ─────────────────────────────────────────────────────────
function InvoiceFinCard({ metadata, onViewPress }) {
  const invNum = metadata?.invoiceNumber || metadata?.number || 'INV-001';
  const client = metadata?.clientName || metadata?.client?.name || 'Client';
  const amount = fmt(metadata?.totalAmount || metadata?.amount);
  const status = (metadata?.status || 'SENT').toUpperCase();
  const statusColor = status === 'PAID' ? '#10B981' : status === 'OVERDUE' ? '#EF4444' : '#3B82F6';

  return (
    <View style={[s.card, { borderLeftColor: '#2563EB', borderLeftWidth: 3 }]}>
      <View style={s.row}>
        <View style={[s.iconBox, { backgroundColor: '#DBEAFE' }]}>
          <Feather name="file" size={16} color="#2563EB" />
        </View>
        <View style={s.info}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.title}>{invNum}</Text>
            <View style={[s.badge, { backgroundColor: `${statusColor}18` }]}>
              <Text style={[s.badgeText, { color: statusColor }]}>{status}</Text>
            </View>
          </View>
          <Text style={s.sub} numberOfLines={1}>{client}</Text>
        </View>
        <Text style={s.amt}>{CURRENCY}{amount}</Text>
      </View>

      <View style={s.actionsRow}>
        <TouchableOpacity style={s.iconAction} onPress={onViewPress}>
          <Feather name="eye" size={13} color="#2563EB" />
          <Text style={[s.iconActionText, { color: '#2563EB' }]}>View</Text>
        </TouchableOpacity>
        <View style={s.div} />
        <TouchableOpacity style={s.iconAction} onPress={onViewPress}>
          <Feather name="share-2" size={13} color="#4B5563" />
          <Text style={s.iconActionText}>Share</Text>
        </TouchableOpacity>
        <View style={s.div} />
        <TouchableOpacity style={s.iconAction} onPress={onViewPress}>
          <Feather name="download" size={13} color="#4B5563" />
          <Text style={s.iconActionText}>PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Compact Document Preview Card ─────────────────────────────────────────────
function DocumentFinCard({ metadata, onViewPress }) {
  const ext = (metadata?.filename || '').split('.').pop()?.toUpperCase() || 'FILE';
  const extColors = { PDF: '#EF4444', DOC: '#2563EB', DOCX: '#2563EB', XLS: '#10B981', XLSX: '#10B981', PNG: '#8B5CF6', JPG: '#F59E0B' };
  const extColor = extColors[ext] || '#6366F1';
  const fileName = metadata?.filename || metadata?.title || 'Document';

  return (
    <View style={s.card}>
      <View style={s.row}>
        <View style={[s.iconBox, { backgroundColor: `${extColor}15` }]}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: extColor }}>{ext}</Text>
        </View>
        <View style={s.info}>
          <Text style={s.title} numberOfLines={1}>{fileName}</Text>
          <Text style={s.sub}>{metadata?.size || 'Attached file'}</Text>
        </View>
      </View>

      {/* Subtle Icon Actions */}
      <View style={s.actionsRow}>
        <TouchableOpacity style={s.iconAction} onPress={onViewPress}>
          <Feather name="eye" size={13} color="#2D8CFF" />
          <Text style={[s.iconActionText, { color: '#2D8CFF' }]}>Preview</Text>
        </TouchableOpacity>
        <View style={s.div} />
        <TouchableOpacity style={s.iconAction} onPress={onViewPress}>
          <Feather name="download" size={13} color="#4B5563" />
          <Text style={s.iconActionText}>Download</Text>
        </TouchableOpacity>
        <View style={s.div} />
        <TouchableOpacity style={s.iconAction} onPress={onViewPress}>
          <Feather name="share-2" size={13} color="#4B5563" />
          <Text style={s.iconActionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Compact Budget Card ───────────────────────────────────────────────────────
function BudgetFinCard({ metadata, onViewPress }) {
  const spent = Number(metadata?.spent || 0);
  const limit = Number(metadata?.limit || 1);
  const pct = Math.round((spent / limit) * 100);
  const over = spent > limit;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onViewPress} style={[s.card, { borderLeftColor: '#6366F1', borderLeftWidth: 3 }]}>
      <View style={s.row}>
        <View style={[s.iconBox, { backgroundColor: '#EDE9FE' }]}>
          <Feather name="bar-chart-2" size={15} color="#6366F1" />
        </View>
        <View style={s.info}>
          <Text style={s.title} numberOfLines={1}>{metadata?.name || 'Budget'}</Text>
          <Text style={s.sub}>{CURRENCY}{fmt(spent)} / {CURRENCY}{fmt(limit)}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: over ? '#FEE2E2' : '#EDE9FE' }]}>
          <Text style={[s.badgeText, { color: over ? '#DC2626' : '#6366F1' }]}>{pct}%</Text>
        </View>
      </View>
      <ProgressBar value={spent} max={limit} color={over ? '#EF4444' : '#6366F1'} />
    </TouchableOpacity>
  );
}

// ── Compact Goal Card ─────────────────────────────────────────────────────────
function GoalFinCard({ metadata, onViewPress }) {
  const current = Number(metadata?.current || metadata?.currentAmount || 0);
  const target = Number(metadata?.target || metadata?.targetAmount || 1);
  const pct = Math.round((current / target) * 100);

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onViewPress} style={[s.card, { borderLeftColor: '#0EA5E9', borderLeftWidth: 3 }]}>
      <View style={s.row}>
        <View style={[s.iconBox, { backgroundColor: '#E0F2FE' }]}>
          <Text style={{ fontSize: 16 }}>{metadata?.emoji || '🎯'}</Text>
        </View>
        <View style={s.info}>
          <Text style={s.title} numberOfLines={1}>{metadata?.name || 'Goal'}</Text>
          <Text style={s.sub}>{CURRENCY}{fmt(current)} / {CURRENCY}{fmt(target)}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: pct >= 100 ? '#D1FAE5' : '#EFF6FF' }]}>
          <Text style={[s.badgeText, { color: pct >= 100 ? '#059669' : '#0284C7' }]}>{pct}%</Text>
        </View>
      </View>
      <ProgressBar value={current} max={target} color="#0EA5E9" />
    </TouchableOpacity>
  );
}

// ── Compact Report Card ───────────────────────────────────────────────────────
function ReportFinCard({ metadata, onViewPress }) {
  const income = Number(metadata?.totalIncome || 0);
  const expense = Number(metadata?.totalExpense || 0);
  const net = Number(metadata?.net ?? (income - expense));

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onViewPress} style={[s.card, { borderLeftColor: '#F59E0B', borderLeftWidth: 3 }]}>
      <View style={s.row}>
        <View style={[s.iconBox, { backgroundColor: '#FEF3C7' }]}>
          <Feather name="pie-chart" size={15} color="#D97706" />
        </View>
        <View style={s.info}>
          <Text style={s.title} numberOfLines={1}>{metadata?.title || 'Monthly Report'}</Text>
          <Text style={s.sub}>{metadata?.month || 'Summary'}</Text>
        </View>
      </View>

      <View style={s.reportStatsRow}>
        <View style={s.stat}>
          <Text style={s.statLabel}>INCOME</Text>
          <Text style={[s.statVal, { color: '#059669' }]}>+{CURRENCY}{fmt(income)}</Text>
        </View>
        <View style={s.statDiv} />
        <View style={s.stat}>
          <Text style={s.statLabel}>EXPENSE</Text>
          <Text style={[s.statVal, { color: '#EF4444' }]}>-{CURRENCY}{fmt(expense)}</Text>
        </View>
        <View style={s.statDiv} />
        <View style={s.stat}>
          <Text style={s.statLabel}>NET</Text>
          <Text style={[s.statVal, { color: net >= 0 ? '#1D4ED8' : '#EF4444' }]}>{net >= 0 ? '+' : ''}{CURRENCY}{fmt(net)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Master Export ─────────────────────────────────────────────────────────────
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
      return <View style={{ paddingTop: 2 }}><VoicePlayer uri={metadata?.uri} duration={metadata?.durationSec} isOwn={isOwn} /></View>;
    case 'INVOICE':
      return <InvoiceFinCard metadata={metadata} onViewPress={onViewPress} />;
    case 'RECEIPT':
      return <ReceiptFinCard metadata={metadata} onViewPress={onViewPress} />;
    default:
      return <ReceiptFinCard metadata={metadata} onViewPress={onViewPress} />;
  }
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    minWidth: 230,
    maxWidth: 275,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  info: {
    flex: 1,
    marginRight: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  sub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 1,
  },
  amt: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#F3F4F6',
  },
  iconAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  iconActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  div: {
    width: 0.5,
    height: 12,
    backgroundColor: '#E5E7EB',
  },
  reportStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#F3F4F6',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '700',
  },
  statVal: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 1,
  },
  statDiv: {
    width: 0.5,
    height: 16,
    backgroundColor: '#E5E7EB',
  },
});
