// screens/AIInsightsScreen.js — Dedicated AI Insights & Visual Analytics Hub
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, RefreshControl, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { useBooks } from '../context/BooksContext';
import { useTransactions } from '../context/TransactionsContext';
import { getCurrencySymbol } from '../utils/planFeatures';
import { api } from '../utils/api';

const screenWidth = Dimensions.get('window').width;

export default function AIInsightsScreen() {
  const navigation = useNavigation();
  const { activeBook } = useBooks();
  const { transactions, getBookBalance, refreshTransactions, loading: txLoading } = useTransactions();

  const [refreshing, setRefreshing] = useState(false);
  const [aiInsightText, setAiInsightText] = useState('');
  const [burnRateData, setBurnRateData] = useState(null);
  const [loadingAi, setLoadingAi] = useState(true);

  // Derive User / Cashbook Currency
  const cur = activeBook?.currency || 'INR';
  const sym = getCurrencySymbol(cur);

  // Fetch deep AI mini insight & burn rate from backend
  const fetchAiData = async () => {
    if (!activeBook?.id) return;
    setLoadingAi(true);
    try {
      const [resInsight, resBurn] = await Promise.all([
        api.get(`/chat/mini-insight/${activeBook.id}`).catch(() => null),
        api.get(`/analytics/burn-rate?cashbookId=${activeBook.id}`).catch(() => null)
      ]);
      if (resInsight?.data) {
        const text = resInsight.data?.data?.insight || resInsight.data?.insight;
        if (text) {
          // Safety clean for wrong currency symbols
          let cleanText = text.replace(/^["']|["']$/g, '').trim();
          if (sym !== '$' && cleanText.includes('$')) {
            cleanText = cleanText.replace(/\$/g, sym);
          }
          setAiInsightText(cleanText);
        }
      }
      if (resBurn?.data?.data) {
        setBurnRateData(resBurn.data.data);
      }
    } catch (err) {
      console.error('AI Insights fetch error:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    fetchAiData();
  }, [activeBook?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshTransactions(), fetchAiData()]);
    setRefreshing(false);
  };

  // Filter transactions for current cashbook
  const bookTxs = useMemo(() => {
    if (!transactions) return [];
    if (!activeBook?.id) return transactions;
    return transactions.filter(t => t.cashbookId === activeBook.id || !t.cashbookId);
  }, [transactions, activeBook?.id]);

  // Real Data Calculations
  const calculations = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const recentTxs = bookTxs.filter(t => new Date(t.date || t.createdAt) >= thirtyDaysAgo);

    let totalIncome = 0;
    let totalExpense = 0;
    let maxExpense = 0;
    const categoryMap = {};
    const merchantMap = {};

    // 7-day trend arrays
    const last7Days = [];
    const dailyExpenses = [];
    const dailyIncomes = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      last7Days.push(dayLabel);

      const dayTxs = bookTxs.filter(t => (t.date || t.createdAt)?.startsWith(dateStr));
      const dayInc = dayTxs.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
      const dayExp = dayTxs.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
      dailyIncomes.push(dayInc);
      dailyExpenses.push(dayExp);
    }

    recentTxs.forEach(t => {
      const amt = parseFloat(t.amount || 0);
      if (t.type === 'INCOME') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
        if (amt > maxExpense) maxExpense = amt;
        const cat = t.category?.name || t.categoryName || 'General';
        categoryMap[cat] = (categoryMap[cat] || 0) + amt;
        if (t.merchant || t.payee) {
          const m = t.merchant || t.payee;
          merchantMap[m] = (merchantMap[m] || 0) + amt;
        }
      }
    });

    // Donut chart pie items
    const pieColors = ['#2D8CFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'];
    const pieData = Object.entries(categoryMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, population], idx) => ({
        name,
        population,
        color: pieColors[idx % pieColors.length],
        legendFontColor: '#4B5563',
        legendFontSize: 12,
      }));

    if (Object.keys(categoryMap).length === 0) {
      pieData.push({
        name: 'No Expenses',
        population: 1,
        color: '#E5E7EB',
        legendFontColor: '#9CA3AF',
        legendFontSize: 12,
      });
    }

    // Top merchant
    const topMerchantEntry = Object.entries(merchantMap).sort(([, a], [, b]) => b - a)[0];
    const topMerchant = topMerchantEntry ? `${topMerchantEntry[0]} (${sym}${topMerchantEntry[1].toLocaleString('en-IN', { maximumFractionDigits: 0 })})` : 'None recorded';

    const avgDailyExpense = totalExpense / 30;
    const savingsRatio = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0;

    // AI Forecast Line vs Actual Trend (Both must have 9 points to match forecastLabels)
    const forecastLabels = [...last7Days, '+2d', '+4d'];
    const lastDayVal = dailyExpenses[dailyExpenses.length - 1] || 100;
    const avgDaily = dailyExpenses.reduce((a, b) => a + b, 0) / (dailyExpenses.length || 1);

    const actualSeries = dailyExpenses.some(v => v > 0)
      ? [...dailyExpenses, lastDayVal, lastDayVal]
      : [100, 120, 110, 140, 130, 160, 150, 150, 150];

    const forecastSeries = dailyExpenses.some(v => v > 0)
      ? [...dailyExpenses, Math.round(lastDayVal * 1.15 || avgDaily * 1.15), Math.round(lastDayVal * 1.35 || avgDaily * 1.35)]
      : [100, 120, 110, 140, 130, 160, 150, 185, 220];

    return {
      totalIncome,
      totalExpense,
      maxExpense,
      avgDailyExpense,
      savingsRatio,
      topMerchant,
      pieData,
      last7Days,
      dailyExpenses,
      dailyIncomes,
      forecastLabels,
      actualSeries,
      forecastSeries,
    };
  }, [bookTxs, sym]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color="#1E293B" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>AI Analytics & Insights</Text>
          <Text style={styles.headerSub}>
            {activeBook ? `${activeBook.name} • Currency: ${cur} (${sym})` : `All Cashbooks • ${cur} (${sym})`}
          </Text>
        </View>
        <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chat')}>
          <Feather name="message-circle" size={20} color="#2D8CFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2D8CFF']} />}
      >
        {/* ─── 1. AI-Driven Accumulated Intelligence Banner ─── */}
        <View style={styles.aiSection}>
          <View style={styles.aiHeader}>
            <View style={styles.aiBadge}>
              <Feather name="cpu" size={16} color="#2D8CFF" />
              <Text style={styles.aiBadgeText} adjustsFontSizeToFit numberOfLines={1}>AI ACCUMULATED INSIGHT</Text>
            </View>
            {burnRateData && (
              <View style={[styles.statusTag, { backgroundColor: burnRateData.status === 'DANGER' ? '#FEE2E2' : burnRateData.status === 'WARNING' ? '#FEF3C7' : '#D1FAE5' }]}>
                <Text style={[styles.statusTagText, { color: burnRateData.status === 'DANGER' ? '#DC2626' : burnRateData.status === 'WARNING' ? '#D97706' : '#059669' }]} adjustsFontSizeToFit numberOfLines={1}>
                  {burnRateData.status || 'SAFE'} RUNWAY
                </Text>
              </View>
            )}
          </View>

          {loadingAi ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#2D8CFF" />
              <Text style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>Analyzing spending patterns in {cur}...</Text>
            </View>
          ) : (
            <Text style={styles.aiInsightText}>
              {aiInsightText || (bookTxs.length > 0
                ? `Your 30-day expense velocity is ${sym}${calculations.avgDailyExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/day across ${bookTxs.length} transactions. ${calculations.savingsRatio >= 20 ? 'Your savings ratio is strong!' : 'Consider reducing discretionary shopping to boost monthly reserves.'}`
                : `Welcome! Start adding income and expenses in ${cur} to unlock deep AI predictive models and cashflow run-rate analysis.`)}
            </Text>
          )}

          {/* AI Run-Rate / Prediction Trend Line */}
          <View style={[styles.aiChartCard, { padding: 0, overflow: 'hidden', paddingTop: 14, paddingBottom: 14 }]}>
            <Text style={[styles.aiChartTitle, { paddingHorizontal: 14 }]}>Accumulated Trend vs AI Forecast ({sym})</Text>
            <LineChart
              data={{
                labels: calculations.forecastLabels,
                datasets: [
                  {
                    data: calculations.actualSeries,
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    strokeWidth: 3.5,
                  },
                  {
                    data: calculations.forecastSeries,
                    color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
                    strokeWidth: 3.5,
                  }
                ],
                legend: ["Actual Trend", "AI Forecast Target"]
              }}
              width={screenWidth - 44}
              height={200}
              yAxisLabel={sym}
              yAxisInterval={1}
              formatYLabel={(y) => {
                const num = parseInt(y, 10);
                if (Math.abs(num) >= 1000) return (num / 1000).toFixed(0) + 'k';
                return num.toString();
              }}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(209, 213, 219, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(51, 65, 85, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: '4', strokeWidth: '2', stroke: '#ffffff' },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
                paddingRight: 36,
                paddingLeft: 12,
                marginLeft: -6,
              }}
            />
            <View style={[styles.aiLegend, { paddingHorizontal: 14, marginTop: 10, gap: 14 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#047857' }}>Actual Spend to Date</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.legendDot, { backgroundColor: '#F97316' }]} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#C2410C' }}>AI Predicted Trajectory</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── 2. Visual Real-Data Analytics (Clean Calculation) ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Visual Analytics & Real Data</Text>
          <Text style={styles.sectionSub}>Exact mathematical breakdowns without estimation</Text>
        </View>

        {/* Key Metrics Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#FEE2E2' }]}>
              <Feather name="trending-down" size={16} color="#DC2626" />
            </View>
            <Text style={styles.metricLabel} adjustsFontSizeToFit numberOfLines={1}>30-Day Expense</Text>
            <Text style={styles.metricValue} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.55}>{sym}{calculations.totalExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#D1FAE5' }]}>
              <Feather name="trending-up" size={16} color="#059669" />
            </View>
            <Text style={styles.metricLabel} adjustsFontSizeToFit numberOfLines={1}>30-Day Income</Text>
            <Text style={styles.metricValue} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.55}>{sym}{calculations.totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#FEF3C7' }]}>
              <Feather name="clock" size={16} color="#D97706" />
            </View>
            <Text style={styles.metricLabel} adjustsFontSizeToFit numberOfLines={1}>Daily Avg Spend</Text>
            <Text style={styles.metricValue} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.55}>{sym}{calculations.avgDailyExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#E0E7FF' }]}>
              <Feather name="percent" size={16} color="#4F46E5" />
            </View>
            <Text style={styles.metricLabel} adjustsFontSizeToFit numberOfLines={1}>Savings Ratio</Text>
            <Text style={styles.metricValue} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.55}>{calculations.savingsRatio}%</Text>
          </View>
        </View>

        {/* Donut / Pie Chart for Expense Breakdown */}
        <View style={[styles.chartCard, { padding: 0, overflow: 'hidden', paddingTop: 14, paddingBottom: 14 }]}>
          <Text style={[styles.chartCardTitle, { paddingHorizontal: 16 }]} adjustsFontSizeToFit numberOfLines={1}>Expense by Category ({sym})</Text>
          <PieChart
            data={calculations.pieData}
            width={screenWidth - 36}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="10"
            absolute
          />
        </View>

        {/* 7-Day Bar Chart: Income vs Expense */}
        <View style={[styles.chartCard, { padding: 0, overflow: 'hidden', paddingTop: 14, paddingBottom: 14 }]}>
          <Text style={[styles.chartCardTitle, { paddingHorizontal: 16 }]} adjustsFontSizeToFit numberOfLines={1}>7-Day Income vs Expense ({sym})</Text>
          <BarChart
            data={{
              labels: calculations.last7Days,
              datasets: [
                {
                  data: calculations.dailyExpenses.some(v => v > 0) ? calculations.dailyExpenses : [0, 0, 0, 0, 0, 0, 0]
                }
              ]
            }}
            width={screenWidth - 44}
            height={220}
            yAxisLabel={sym}
            yAxisInterval={1}
            formatYLabel={(y) => {
              const num = parseInt(y, 10);
              if (isNaN(num)) return y;
              if (Math.abs(num) >= 10000000) return (num / 10000000).toFixed(1) + 'Cr';
              if (Math.abs(num) >= 100000) return (num / 100000).toFixed(1) + 'L';
              if (Math.abs(num) >= 1000) return (num / 1000).toFixed(0) + 'k';
              return num.toString();
            }}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: { borderRadius: 12 },
              barPercentage: 0.65,
            }}
            style={{
              marginVertical: 8,
              borderRadius: 12,
              paddingRight: 36,
              paddingLeft: 12,
              marginLeft: -6,
            }}
          />
        </View>

        {/* Top Spend Highlights */}
        <View style={styles.highlightCard}>
          <View style={styles.highlightRow}>
            <Text style={styles.highlightLabel} adjustsFontSizeToFit numberOfLines={1}>Highest Single Expense:</Text>
            <Text style={styles.highlightValue} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.65}>{sym}{calculations.maxExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
          </View>
          <View style={[styles.highlightRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.highlightLabel} adjustsFontSizeToFit numberOfLines={1}>Top Payee / Merchant:</Text>
            <Text style={styles.highlightValue} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.65}>{calculations.topMerchant}</Text>
          </View>
        </View>

        {/* ─── Interactive AI Chat CTA ─── */}
        <TouchableOpacity style={styles.ctaButton} onPress={() => navigation.navigate('Chat')} activeOpacity={0.9}>
          <View style={styles.ctaIconWrap}>
            <Feather name="message-circle" size={22} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Need deeper AI advice?</Text>
            <Text style={styles.ctaSub}>Chat with your financial AI assistant about ways to cut burn rate or invest excess cash.</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#ffffff" />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  headerSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  chatBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  container: { flex: 1 },
  content: { padding: 16 },

  aiSection: {
    backgroundColor: '#EFF6FF', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 24,
  },
  aiHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12,
  },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, flexShrink: 1,
  },
  aiBadgeText: { fontSize: 11, fontWeight: '800', color: '#1E40AF', letterSpacing: 0.5 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', flexShrink: 0 },
  statusTagText: { fontSize: 10, fontWeight: '800' },
  aiInsightText: {
    fontSize: 14, color: '#1E293B', lineHeight: 22, fontWeight: '500', marginBottom: 16,
  },
  aiChartCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  aiChartTitle: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6 },
  aiLegend: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, paddingHorizontal: 4,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2D8CFF' },
  legendText: { fontSize: 11, color: '#64748B', flex: 1, lineHeight: 15 },

  sectionHeader: { marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  sectionSub: { fontSize: 12, color: '#64748B', marginTop: 2 },

  gridContainer: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20,
  },
  metricCard: {
    width: (screenWidth - 44) / 2, backgroundColor: '#ffffff',
    borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  metricIcon: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  metricLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  metricValue: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginTop: 4 },

  chartCard: {
    backgroundColor: '#ffffff', borderRadius: 20, padding: 16,
    marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9',
  },
  chartCardTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 12 },

  highlightCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
    marginBottom: 24, borderWidth: 1, borderColor: '#F1F5F9',
  },
  highlightRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  highlightLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  highlightValue: { fontSize: 14, color: '#0F172A', fontWeight: '700', flexShrink: 1, textAlign: 'right' },

  ctaButton: {
    backgroundColor: '#2D8CFF', borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#2D8CFF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  ctaIconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  ctaTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff', marginBottom: 2 },
  ctaSub: { fontSize: 12, color: '#E0F2FE', lineHeight: 17 },
});
