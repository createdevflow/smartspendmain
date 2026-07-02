// screens/HomeScreen.js — Dashboard redesign
import React, { useMemo, useState, useContext, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, Pressable, Platform,
  KeyboardAvoidingView, RefreshControl, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useBooks } from '../context/BooksContext';
import { useTransactions } from '../context/TransactionsContext';
import { useChat } from '../context/ChatContext';
import SwipeTabsWrapper from '../components/SwipeTabsWrapper';
import QuickEntrySheet from '../components/QuickEntrySheet';
import TxCard from '../components/TxCard';
import { generateInvoicePdf } from '../utils/reporting';
import BusinessCategorySetupModal from '../components/BusinessCategorySetupModal';
import { getCurrencySymbol, featureEnabled } from '../utils/planFeatures';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import InvoiceTicket from '../components/InvoiceTicket';
import { BlurView } from 'expo-blur';
import { api } from '../utils/api';
import SchedulerModal from '../components/SchedulerModal';

// ─── Insight mini-card ─────────────────────────────────────────────────────────
function InsightCard({ icon, label, value, color, onPress }) {
  return (
    <TouchableOpacity style={styles.insightCard} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.insightIcon, { backgroundColor: `${color}18` }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={styles.insightLabel}>{label}</Text>
      <Text style={[styles.insightValue, { color }]}>{value}</Text>
    </TouchableOpacity>
  );
}

// ─── Budget set modal ──────────────────────────────────────────────────────────
function SetValueModal({ visible, title, currentValue, onSave, onClose }) {
  const [val, setVal] = useState(currentValue ? String(currentValue) : '');

  useEffect(() => {
    if (visible) setVal(currentValue ? String(currentValue) : '');
  }, [visible, currentValue]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.centerModal}>
          <Text style={styles.centerModalTitle}>{title}</Text>
          <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 20 }}>
            Enter the amount to set for your {title.toLowerCase().replace('set ', '')}.
          </Text>
          <TextInput
            style={[styles.centerModalInput, { textAlign: 'center', fontSize: 24, fontWeight: '700', paddingVertical: 16 }]}
            value={val}
            onChangeText={setVal}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor="#D1D5DB"
            autoFocus
          />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <TouchableOpacity style={styles.centerModalCancel} onPress={onClose}>
              <Text style={{ color: '#4B5563', fontWeight: '600', fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.centerModalSave}
              onPress={() => { onSave(parseFloat(val) || 0); onClose(); }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { books, activeBook, addBook, setActiveBook, refreshBooks } = useBooks();
  const { transactions, addTransaction, getBookBalance, privateMode, monthlyBudget, setMonthlyBudget, savingsGoal, setSavingsGoal, refreshTransactions } = useTransactions();
  const { hasAccess: isFeatureEnabled, getFeatureTease } = useFeatureAccess();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refreshTransactions?.(),
      refreshBooks?.(),
    ]);
    setRefreshing(false);
  }, [refreshTransactions, refreshBooks]);

  const [sheetType, setSheetType] = useState('out');
  const quickEntryRef = useRef(null);
  const { totalUnread } = useChat();
  const [createVisible, setCreateVisible] = useState(false);
  const [bookName, setBookName] = useState('');
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [savingsModalVisible, setSavingsModalVisible] = useState(false);

  const invoiceRef = useRef();
  const [lastSavedTx, setLastSavedTx] = useState(null);
  const [invoiceMenuTx, setInvoiceMenuTx] = useState(null);

  // Scheduler
  const schedulerEnabled = isFeatureEnabled('scheduled_communications');
  const [schedulerTx, setSchedulerTx] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);

  const active = activeBook || books[0] || null;
  const balance = active ? getBookBalance(active.id) : { inTotal: 0, outTotal: 0, balance: 0 };
  const sym = getCurrencySymbol(active ? active.currency : null);

  const hasAiInsights = featureEnabled(user, 'analytics_basic');
  const [gamification, setGamification] = useState(null);
  const [upcomingBills, setUpcomingBills] = useState([]);
  const [miniInsight, setMiniInsight] = useState('');
  
  const [showTrialBanner, setShowTrialBanner] = useState(true);
  const isTrialActive = user?.trialExpiresAt && new Date(user.trialExpiresAt) > new Date();

  useEffect(() => {
    // Fetch gamification metrics
    const fetchGamification = async () => {
      try {
        const url = active?.id ? `/analytics/burn-rate?cashbookId=${active.id}` : '/analytics/burn-rate';
        const res = await api.get(url);
        if (res.data?.data) {
          setGamification(res.data.data);
        }
      } catch (err) {
        // likely disabled or error, just ignore silently
      }
    };
    
    const fetchUpcomingBills = async () => {
      if (!isFeatureEnabled('feature_upcoming_bills') || !active?.id) return;
      try {
        const res = await api.get(`/transactions/upcoming-bills/${active.id}`);
        const dataArray = res.data?.data || res.data || [];
        setUpcomingBills(Array.isArray(dataArray) ? dataArray : []);
      } catch (err) {}
    };

    const fetchMiniInsight = async () => {
      if (!isFeatureEnabled('feature_ai_insights_mini') || !active?.id) return;
      try {
        const res = await api.get(`/chat/mini-insight/${active.id}`);
        if (res.data?.insight) setMiniInsight(res.data.insight);
      } catch (err) {}
    };

    fetchGamification();
    fetchUpcomingBills();
    fetchMiniInsight();
  }, [transactions, active?.id]);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'there';

  // ── 7-day cashflow data ──
  const graphData = useMemo(() => {
    if (!active) return null;
    const today = new Date();
    const labels = [];
    const incomeData = [];
    const expenseData = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d);   end.setHours(23, 59, 59, 999);
      
      let inc = 0;
      let exp = 0;
      transactions.forEach((t) => {
        if (t.cashbookId !== active.id) return;
        const ts = new Date(t.date).getTime();
        if (ts < start.getTime() || ts > end.getTime()) return;
        if (t.type === 'INCOME' || t.type === 'in')  inc += parseFloat(t.amount || 0);
        if (t.type === 'EXPENSE' || t.type === 'out') exp += parseFloat(t.amount || 0);
      });
      
      labels.push(d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 3));
      incomeData.push(inc);
      expenseData.push(exp);
    }
    return { labels, incomeData, expenseData };
  }, [transactions, active]);

  // ── Insights ──
  const thisMonth = useMemo(() => {
    if (!active) return { income: 0, expense: 0 };
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    let income = 0, expense = 0;
    transactions.forEach((t) => {
      if (t.cashbookId !== active.id) return;
      if (new Date(t.date) < start) return;
      if (t.type === 'INCOME')  income  += parseFloat(t.amount || 0);
      if (t.type === 'EXPENSE') expense += parseFloat(t.amount || 0);
    });
    return { income, expense };
  }, [transactions, active]);

  const budgetPct = monthlyBudget > 0 ? Math.min(100, Math.round((thisMonth.expense / monthlyBudget) * 100)) : null;
  const savingsPct = savingsGoal > 0 ? Math.min(100, Math.round((balance.balance / savingsGoal) * 100)) : null;

  // ── Top categories (Top 3) ──
  const topCategories = useMemo(() => {
    if (!active) return [];
    const map = {};
    let totalExpense = 0;
    transactions.forEach((t) => {
      if (t.cashbookId !== active.id || t.type !== 'EXPENSE') return;
      const cat = t.merchant || t.category?.name || 'Other';
      const amt = parseFloat(t.amount || 0);
      map[cat] = (map[cat] || 0) + amt;
      totalExpense += amt;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return sorted.map(([name, amount]) => ({
      name,
      amount,
      pct: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
    }));
  }, [transactions, active]);
  const topCategory = topCategories[0]?.name || null;

  // ── Recent 3 transactions ──
  const recentTx = useMemo(() => {
    if (!active) return [];
    return transactions
      .filter((t) => t.cashbookId === active.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
  }, [transactions, active]);


  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const fetchNotifs = async () => {
        try {
          const res = await api.get('/notifications');
          const raw = res.data?.items || res.data?.data || res.data;
          const notifs = Array.isArray(raw) ? raw : [];
          const unread = typeof res.data?.unreadCount === 'number' ? res.data.unreadCount : notifs.filter(n => !n?.isRead).length;
          setUnreadCount(unread);
        } catch (e) {
          console.error("HomeScreen loadNotifs error", e);
        }
      };
      fetchNotifs();
    }, [])
  );

  const handleQuickSave = (data) => {
    if (!active) return;
    addTransaction({
      bookId: active.id, type: data.type, amount: data.amount,
      currency: active ? active.currency : 'INR', date: data.date,
      category: data.category, note: data.note, paymentMethod: data.paymentMethod,
      isGstApplied: data.isGstApplied, gstRate: data.gstRate,
      cgst: data.cgst, sgst: data.sgst, igst: data.igst,
      isTaxDeductible: data.isTaxDeductible
    });
    quickEntryRef.current?.dismiss();
  };

  // ── Create first book ──
  const handleCreateFirstBook = async () => {
    if (!bookName.trim()) return;
    const nb = await addBook({ name: bookName.trim(), color: '#1D4ED8' });
    if (nb) { setActiveBook(nb.id); setCreateVisible(false); setBookName(''); }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SwipeTabsWrapper>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
        >
          {/* ── Greeting header ── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{greeting}, {firstName} 👋</Text>
              <Text style={styles.headerSub}>
                {active ? active.name : 'Cashtro'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <TouchableOpacity
                style={styles.privateBadge}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Feather name="bell" size={18} color="#1D4ED8" />
                {unreadCount > 0 && (
                  <View style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#DC2626', borderWidth: 2, borderColor: '#EEF2FF' }} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.privateBadge}
                onPress={() => navigation.navigate('Chat')}
              >
                <View style={{ position: 'relative' }}>
                  <Feather name="message-circle" size={20} color="#1D4ED8" />
                  {totalUnread > 0 && (
                    <View style={{
                      position: 'absolute', top: -6, right: -8,
                      backgroundColor: '#EF4444', borderRadius: 8,
                      minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
                      paddingHorizontal: 3, borderWidth: 2, borderColor: '#EEF2FF'
                    }}>
                      <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
                        {totalUnread > 99 ? '99+' : totalUnread}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Free Trial Banner ── */}
          {showTrialBanner && isTrialActive && (
            <View style={{ backgroundColor: '#DBEAFE', padding: 12, borderRadius: 12, marginHorizontal: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#BFDBFE' }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="zap" size={16} color="#2563EB" />
                <Text style={{ fontSize: 13, color: '#1E3A8A', fontWeight: '600' }}>
                  Free Trial Active (ends {new Date(user.trialExpiresAt).toLocaleDateString()})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowTrialBanner(false)} style={{ padding: 4 }}>
                <Feather name="x" size={16} color="#1E3A8A" />
              </TouchableOpacity>
            </View>
          )}

          {/* ── No cashbook state ── */}
          {!active ? (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📒</Text>
              <Text style={styles.emptyTitle}>Create your first cashbook</Text>
              <Text style={styles.emptyText}>A cashbook is where you track money in and out.</Text>
              <TextInput
                style={styles.emptyInput}
                placeholder="Cashbook name (e.g. Personal)"
                placeholderTextColor="#9CA3AF"
                value={bookName}
                onChangeText={setBookName}
              />
              <TouchableOpacity
                style={[styles.emptyBtn, !bookName.trim() && { opacity: 0.5 }]}
                onPress={handleCreateFirstBook}
                disabled={!bookName.trim()}
              >
                <Text style={styles.emptyBtnText}>Create Cashbook →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {isFeatureEnabled('feature_ai_insights_mini') && miniInsight ? (
                <View style={{ backgroundColor: '#EEF2FF', borderRadius: 16, padding: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ backgroundColor: '#C7D2FE', padding: 10, borderRadius: 12 }}>
                    <Feather name="cpu" size={20} color="#4338CA" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: '#4338CA', fontWeight: '800', marginBottom: 2 }}>Smart Insight</Text>
                    <Text style={{ fontSize: 13, color: '#312E81', lineHeight: 18 }}>{miniInsight}</Text>
                  </View>
                </View>
              ) : getFeatureTease('feature_ai_insights_mini') ? (
                <TouchableOpacity 
                  style={{ backgroundColor: '#F3F4F6', borderRadius: 16, padding: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E5E7EB' }}
                  onPress={() => Alert.alert('Premium Feature', 'AI Smart Insights are only available on Pro plans. Upgrade to get daily financial analysis!', [{ text: 'Cancel', style: 'cancel' }, { text: 'Upgrade to Pro' }])}
                >
                  <View style={{ backgroundColor: '#E5E7EB', padding: 10, borderRadius: 12 }}>
                    <Feather name="lock" size={20} color="#9CA3AF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '800', marginBottom: 2 }}>AI Smart Insight Locked</Text>
                    <Text style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 18 }}>Upgrade to Pro to see personalized daily insights about your spending patterns.</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              ) : null}

              {/* ── Gamification Widget ── */}
              {isFeatureEnabled('feature_gamification_active') && gamification ? (
                <View style={{ backgroundColor: '#F0FDF4', borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#BBF7D0' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Feather name="award" size={20} color="#16A34A" />
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#14532D' }}>No Spend Streak</Text>
                    </View>
                    <View style={{ backgroundColor: '#16A34A', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>🔥 {gamification.streak} Days</Text>
                    </View>
                  </View>
                  
                  <View style={{ height: 1, backgroundColor: '#BBF7D0', marginVertical: 12 }} />
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontSize: 12, color: '#166534', fontWeight: '600' }}>Burn Rate (Avg/Day)</Text>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: '#14532D' }}>{sym}{Math.round(gamification.avgDailySpend)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 12, color: '#166534', fontWeight: '600' }}>Runway Left</Text>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: '#14532D' }}>{gamification.burnRateDaysLeft} Days</Text>
                    </View>
                  </View>
                </View>
              ) : getFeatureTease('feature_gamification_active') ? (
                <TouchableOpacity
                  style={{ backgroundColor: '#F3F4F6', borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#E5E7EB', opacity: 0.85 }}
                  onPress={() => Alert.alert('Pro Feature 🔥', 'Spend streaks and burn-rate analysis are available on Pro plans.\n\nUpgrade to track your no-spend days and see how long your money lasts!', [{ text: 'Maybe Later', style: 'cancel' }, { text: 'Upgrade to Pro', onPress: () => navigation.navigate('Plans') }])}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Feather name="lock" size={20} color="#9CA3AF" />
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#9CA3AF' }}>Streak & Burn Rate</Text>
                    </View>
                    <View style={{ backgroundColor: '#D1D5DB', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>PRO ONLY</Text>
                    </View>
                  </View>
                  <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 }} />
                  <Text style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 18 }}>Track your no-spend streaks and see your daily burn rate to stay on budget.</Text>
                </TouchableOpacity>
              ) : null}

              {/* ─── 1. Hero Balance Card ─── */}
              <View style={styles.heroCard}>
                <Text style={styles.heroLabel}>Available Balance</Text>
                <Text style={styles.heroBalance}>
                  {privateMode ? '••••••' : `${sym}${Math.abs(balance.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </Text>
                <View style={styles.heroDelta}>
                  <View style={styles.heroDeltaItem}>
                    <Feather name="arrow-down-left" size={13} color="#16A34A" />
                    <Text style={[styles.heroDeltaText, { color: '#16A34A' }]}>
                      {privateMode ? '••' : `+${sym}${thisMonth.income.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`}
                    </Text>
                    <Text style={styles.heroDeltaMeta}> this month</Text>
                  </View>
                  <View style={styles.heroDeltaItem}>
                    <Feather name="arrow-up-right" size={13} color="#DC2626" />
                    <Text style={[styles.heroDeltaText, { color: '#DC2626' }]}>
                      {privateMode ? '••' : `−${sym}${thisMonth.expense.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`}
                    </Text>
                    <Text style={styles.heroDeltaMeta}> this month</Text>
                  </View>
                </View>
              </View>

              {/* ─── 2. Quick Actions ─── */}
              <View style={styles.section}>
                <View style={styles.quickActions}>
                  {[
                    { label: 'View All', icon: 'list', color: '#1D4ED8', bg: '#EFF6FF', action: () => navigation.navigate('Transactions') },
                    { label: 'Cashbooks', icon: 'book-open', color: '#2563EB', bg: '#DBEAFE', action: () => navigation.navigate('Books') },
                  ].map((q) => (
                    <TouchableOpacity key={q.label} style={styles.quickAction} onPress={q.action} activeOpacity={0.8}>
                      <View style={[styles.quickActionIcon, { backgroundColor: q.bg }]}>
                        <Feather name={q.icon} size={22} color={q.color} />
                      </View>
                      <Text style={styles.quickActionLabel}>{q.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* ─── 3. Insights Row ─── */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Insights</Text>
                <View style={styles.insightsRow}>
                  {isFeatureEnabled('feature_budget_management') && (
                    <InsightCard
                      icon="pie-chart"
                      label="Budget Used"
                      value={budgetPct !== null ? `${budgetPct}%` : 'Set budget'}
                      color="#1D4ED8"
                      onPress={() => setBudgetModalVisible(true)}
                    />
                  )}
                  {isFeatureEnabled('feature_savings_goals') && (
                    <InsightCard
                      icon="target"
                      label="Savings Goal"
                      value={savingsPct !== null ? `${savingsPct}%` : 'Set goal'}
                      color="#10B981"
                      onPress={() => setSavingsModalVisible(true)}
                    />
                  )}
                </View>
              </View>

              {/* ─── Top Spending Categories ─── */}
              {isFeatureEnabled('feature_top_categories') && topCategories.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Top Spending Categories</Text>
                  <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16 }}>
                    {topCategories.map((c, i) => (
                      <View key={i} style={{ marginBottom: i === topCategories.length - 1 ? 0 : 16 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>{c.name}</Text>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1F2937' }}>{sym}{c.amount.toLocaleString('en-IN')}</Text>
                        </View>
                        <View style={{ height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                          <View style={{ height: '100%', width: `${c.pct}%`, backgroundColor: i === 0 ? '#DC2626' : i === 1 ? '#F59E0B' : '#10B981', borderRadius: 4 }} />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ) : getFeatureTease('feature_top_categories') ? (
                <TouchableOpacity
                  style={[styles.section]}
                  onPress={() => Alert.alert('Pro Feature 📊', 'Top spending category analysis is available on Pro plans.\n\nSee exactly where your money goes each month!', [{ text: 'Maybe Later', style: 'cancel' }, { text: 'Upgrade to Pro', onPress: () => navigation.navigate('Plans') }])}
                >
                  <Text style={styles.sectionLabel}>Top Spending Categories</Text>
                  <View style={{ backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' }}>
                    {['Food & Dining', 'Transport', 'Shopping'].map((cat, i) => (
                      <View key={i} style={{ marginBottom: i === 2 ? 0 : 14 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#D1D5DB' }}>{cat}</Text>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: '#D1D5DB' }}>••••</Text>
                        </View>
                        <View style={{ height: 8, backgroundColor: '#E5E7EB', borderRadius: 4 }} />
                      </View>
                    ))}
                    <View style={{ alignItems: 'center', marginTop: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Feather name="lock" size={14} color="#9CA3AF" />
                        <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '600' }}>Upgrade to unlock category insights</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ) : null}

              {/* ─── Upcoming Bills ─── */}
              {isFeatureEnabled('feature_upcoming_bills') && upcomingBills.length > 0 ? (
                <View style={styles.section}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>Upcoming Bills</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Subscriptions')}>
                      <Text style={{ color: '#2563EB', fontSize: 13, fontWeight: '700' }}>Manage</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                    {upcomingBills.map((bill, i) => (
                      <View key={i} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, width: 220, borderWidth: 1, borderColor: '#F3F4F6' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <View style={{ backgroundColor: '#FEF2F2', padding: 8, borderRadius: 10 }}>
                            <Feather name="calendar" size={18} color="#DC2626" />
                          </View>
                          <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600' }}>{bill.frequency === 'monthly' ? 'Monthly' : 'Weekly'}</Text>
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 }}>{bill.merchant || 'Subscription'}</Text>
                        <Text style={{ fontSize: 14, color: '#DC2626', fontWeight: '800', marginBottom: 12 }}>{sym}{bill.amount.toLocaleString('en-IN')}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Feather name="clock" size={12} color="#9CA3AF" />
                          <Text style={{ fontSize: 12, color: '#6B7280' }}>Due {new Date(bill.nextDueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : getFeatureTease('feature_upcoming_bills') ? (
                <TouchableOpacity
                  style={styles.section}
                  onPress={() => Alert.alert('Pro Feature 📅', 'Upcoming Bills tracking is available on Pro plans.\n\nNever miss a payment again!', [{ text: 'Maybe Later', style: 'cancel' }, { text: 'Upgrade to Pro', onPress: () => navigation.navigate('Plans') }])}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>Upcoming Bills</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Feather name="lock" size={12} color="#9CA3AF" />
                      <Text style={{ color: '#9CA3AF', fontSize: 12, fontWeight: '600' }}>Pro</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ backgroundColor: '#FEE2E2', padding: 10, borderRadius: 12 }}>
                      <Feather name="calendar" size={20} color="#FCA5A5" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#D1D5DB' }}>Bill Reminders</Text>
                      <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Track recurring bills and get reminders</Text>
                    </View>
                    <Feather name="lock" size={16} color="#D1D5DB" />
                  </View>
                </TouchableOpacity>
              ) : null}

              {/* ─── 4. Cashflow Chart ─── */}
              {isFeatureEnabled('feature_analytics') && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>7-Day Cashflow ({sym})</Text>
                  <View style={[styles.chartCard, { padding: 0, paddingBottom: 16 }]}>
                    {graphData && (graphData.incomeData.some(v => v > 0) || graphData.expenseData.some(v => v > 0)) ? (
                      <View style={{ overflow: 'hidden', borderRadius: 16, paddingTop: 16 }}>
                        <LineChart
                          data={{
                            labels: graphData.labels,
                            datasets: [
                              {
                                data: graphData.incomeData,
                                color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
                                strokeWidth: 3
                              },
                              {
                                data: graphData.expenseData,
                                color: (opacity = 1) => `rgba(220, 38, 38, ${opacity})`,
                                strokeWidth: 3
                              }
                            ],
                            legend: ["Income", "Expense"]
                          }}
                          width={Dimensions.get("window").width - 40}
                          height={220}
                          yAxisLabel=""
                          yAxisSuffix=""
                          yAxisInterval={1} 
                          formatYLabel={(y) => {
                            const num = parseInt(y, 10);
                            if (Math.abs(num) >= 1000) return (num / 1000).toFixed(0) + 'k';
                            return num.toString();
                          }}
                          chartConfig={{
                            backgroundColor: "#ffffff",
                            backgroundGradientFrom: "#ffffff",
                            backgroundGradientTo: "#ffffff",
                            decimalPlaces: 0, 
                            color: (opacity = 1) => `rgba(209, 213, 219, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                            style: { borderRadius: 16 },
                            propsForDots: { r: "4", strokeWidth: "2", stroke: "#fff" },
                            propsForBackgroundLines: {
                              strokeDasharray: '', // solid background lines
                              stroke: '#F3F4F6'
                            }
                          }}
                          bezier
                          style={{
                            marginVertical: 8,
                            borderRadius: 16,
                            paddingRight: 40,
                            paddingLeft: 10,
                            marginLeft: 5,
                          }}
                        />
                      </View>
                    ) : (
                      <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                        <Text style={{ color: '#9CA3AF', fontSize: 14 }}>No transactions in the past 7 days</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}



              {/* ─── 6. Recent Transactions ─── */}
              <View style={styles.section}>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionLabel}>Recent Transactions</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
                    <Text style={styles.viewAll}>View All →</Text>
                  </TouchableOpacity>
                </View>

                {recentTx.length === 0 ? (
                  <View style={styles.recentEmpty}>
                    <Text style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center' }}>
                      No transactions yet. Tap Add Income or Add Expense above.
                    </Text>
                  </View>
                ) : (
                  recentTx.map((t) => (
                    <TxCard
                      key={t.id}
                      t={t}
                      currencySymbol={sym}
                      privateMode={privateMode}
                      onEdit={active?.memberRole === 'VIEWER' ? null : (tx) => {
                        setSheetType(tx.type === 'INCOME' ? 'in' : 'out');
                        setEditTxData(tx);
                        quickEntryRef.current?.present();
                      }}
                      onDelete={active?.memberRole === 'VIEWER' ? null : () => navigation.navigate('Transactions')}
                      onInvoice={(tx) => setInvoiceMenuTx(tx)}
                      onSchedule={schedulerEnabled ? (tx) => { setSchedulerTx(tx); setShowScheduler(true); } : null}
                    />
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>

        {/* Floating Action Buttons */}
        {active && active.memberRole !== 'VIEWER' && (
          <BlurView intensity={60} tint="light" style={styles.fabContainer}>
            <TouchableOpacity style={[styles.fabBtn, styles.fabOut]} onPress={() => { setSheetType('out'); quickEntryRef.current?.present(); }} activeOpacity={0.9}>
              <Text style={styles.fabText}>- Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.fabBtn, styles.fabIn]} onPress={() => { setSheetType('in'); quickEntryRef.current?.present(); }} activeOpacity={0.9}>
              <Text style={styles.fabText}>+ Income</Text>
            </TouchableOpacity>
          </BlurView>
        )}

        {/* Offscreen Invoice Ticket for sharing */}
        <View style={{ position: 'absolute', left: -9999, top: 0 }}>
          <InvoiceTicket ref={invoiceRef} transaction={lastSavedTx} />
        </View>

        {/* Invoice Menu Tooltip */}
        <Modal visible={!!invoiceMenuTx} transparent animationType="fade" onRequestClose={() => setInvoiceMenuTx(null)}>
          <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setInvoiceMenuTx(null)} />
          <View style={styles.tooltipMenu}>
            <Text style={styles.tooltipTitle}>Transaction Options</Text>
            <TouchableOpacity style={styles.menuItem} onPress={async () => {
              const tx = invoiceMenuTx;
              setInvoiceMenuTx(null);
              setLastSavedTx(tx);
              setTimeout(async () => {
                if (invoiceRef.current) {
                  try {
                    const uri = await invoiceRef.current.capture();
                    if (await Sharing.isAvailableAsync()) {
                      await Sharing.shareAsync(uri, { dialogTitle: 'Share SmartSpend Receipt' });
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }
              }, 500);
            }}>
              <Feather name="share-2" size={18} color="#111827" />
              <Text style={styles.menuText}>Share Receipt Image</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={async () => {
              const tx = invoiceMenuTx;
              setInvoiceMenuTx(null);
              await generateInvoicePdf(activeBook, [tx]);
            }}>
              <Feather name="download" size={18} color="#111827" />
              <Text style={styles.menuText}>Download PDF</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Quick Entry Sheet */}
        <QuickEntrySheet
          ref={quickEntryRef}
          onClose={() => quickEntryRef.current?.dismiss()}
          onSave={handleQuickSave}
          defaultType={sheetType}
        />

        {/* Budget modal */}
        <SetValueModal
          visible={budgetModalVisible}
          title="Set Monthly Budget"
          currentValue={monthlyBudget}
          onSave={(v) => setMonthlyBudget(v)}
          onClose={() => setBudgetModalVisible(false)}
        />

        {/* Savings modal */}
        <SetValueModal
          visible={savingsModalVisible}
          title="Set Savings Goal"
          currentValue={savingsGoal}
          onSave={(v) => setSavingsGoal(v)}
          onClose={() => setSavingsModalVisible(false)}
        />
        
        {/* Scheduler Modal */}
        <SchedulerModal
          visible={showScheduler}
          onClose={() => { setShowScheduler(false); setSchedulerTx(null); }}
          transaction={schedulerTx}
          defaultType="email"
        />

        {/* Onboarding First Login Setup */}
        <BusinessCategorySetupModal />
      </SafeAreaView>
    </SwipeTabsWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F9FC' },
  scroll: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  privateBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
  },

  // Empty
  emptyCard: {
    margin: 20, borderRadius: 20, backgroundColor: '#fff', padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20 },
  emptyInput: {
    width: '100%', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 14, fontSize: 15, color: '#111827', marginBottom: 14,
  },
  emptyBtn: {
    width: '100%', backgroundColor: '#1D4ED8', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Hero Balance Card
  heroCard: {
    marginHorizontal: 20, marginBottom: 20, borderRadius: 20,
    backgroundColor: '#1D4ED8', padding: 24,
  },
  heroLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  heroBalance: { fontSize: 40, fontWeight: '800', color: '#fff', letterSpacing: -1.5, marginBottom: 16 },
  heroDelta: { flexDirection: 'row', gap: 20 },
  heroDeltaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroDeltaText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  heroDeltaMeta: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },

  // Section
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  viewAll: { fontSize: 13, color: '#1D4ED8', fontWeight: '600' },

  // Quick actions
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction: { alignItems: 'center', flex: 1 },
  quickActionIcon: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  quickActionLabel: { fontSize: 11, fontWeight: '600', color: '#374151', textAlign: 'center' },

  // Insights row
  insightsRow: { flexDirection: 'row', gap: 10 },
  insightCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center',
  },
  insightIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  insightLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', textAlign: 'center', marginBottom: 4 },
  insightValue: { fontSize: 14, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },

  // Chart
  chartCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden',
  },

  // AI Insights
  aiCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EEF2FF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#C7D2FE',
  },
  aiCardLocked: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  aiCardLeft: { flex: 1 },
  aiCardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  aiCardText: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
  upgradeBtn: {
    backgroundColor: '#1D4ED8', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    marginLeft: 12,
  },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  // Recent transactions
  recentEmpty: { backgroundColor: '#F9FAFB', padding: 24, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#E5E7EB' },

  // Tooltip
  tooltipMenu: {
    position: 'absolute', top: '40%', left: '10%', right: '10%',
    backgroundColor: '#fff', borderRadius: 16, padding: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1, shadowRadius: 24, elevation: 20,
  },
  tooltipTitle: { fontSize: 14, fontWeight: '700', color: '#6B7280', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginBottom: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  menuText: { fontSize: 16, color: '#111827', fontWeight: '500' },

  // Modals
  modalBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  centerModal: {
    width: '85%',
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
  },
  centerModalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  centerModalInput: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 14, fontSize: 16, color: '#111827', marginBottom: 16,
  },
  centerModalCancel: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: '#F3F4F6', alignItems: 'center',
  },
  centerModalSave: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: '#1D4ED8', alignItems: 'center',
  },
  
  // Floating Action Buttons
  fabContainer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  fabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  fabOut: {
    backgroundColor: '#EF4444',
  },
  fabIn: {
    backgroundColor: '#10B981',
  },
  fabText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
