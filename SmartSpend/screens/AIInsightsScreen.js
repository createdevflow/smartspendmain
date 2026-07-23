// screens/AIInsightsScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform, useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getCurrencySymbol } from '../utils/planFeatures';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { useBooks } from '../context/BooksContext';
import { useTransactions } from '../context/TransactionsContext';
import { api } from '../utils/api';

const formatCompact = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return Math.round(num).toString();
};

export default function AIInsightsScreen() {
  const navigation = useNavigation();
  const { activeBook } = useBooks();
  const { transactions, refreshTransactions } = useTransactions();
  const { width: screenWidth } = useWindowDimensions();

  const [refreshing, setRefreshing] = useState(false);
  const [loadingBackend, setLoadingBackend] = useState(true);

  // Section A - AI
  const [aiInsightText, setAiInsightText] = useState('');
  
  // Section B - Server Aggregated
  const [dashboardData, setDashboardData] = useState(null);
  const [cashflowData, setCashflowData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [budgetsData, setBudgetsData] = useState([]);

  const cur = activeBook?.currency || 'INR';
  const sym = getCurrencySymbol(cur);

  const fetchData = async () => {
    const bookId = activeBook?.id;
    if (!bookId) return;
    setLoadingBackend(true);
    try {
      const [resInsight, resDash, resCashflow, resCats, resBudgets] = await Promise.all([
        api.get(`/chat/mini-insight/${bookId}`).catch(() => null),
        api.get(`/analytics/dashboard?cashbookId=${bookId}`).catch(() => null),
        api.get(`/analytics/cashflow?period=weekly&cashbookId=${bookId}`).catch(() => null),
        api.get(`/analytics/categories?type=EXPENSE&cashbookId=${bookId}`).catch(() => null),
        api.get(`/budgets`).catch(() => null)
      ]);

      if (resInsight?.data) {
        let text = resInsight.data?.data?.insight || resInsight.data?.insight || '';
        text = text.replace(/^["']|["']$/g, '').trim();
        if (sym !== '$' && text.includes('$')) {
          text = text.replace(/\$/g, sym);
        }
        setAiInsightText(text);
      }
      if (resDash?.data?.data || resDash?.data) setDashboardData(resDash.data.data || resDash.data);
      
      // Cashflow: backend wraps array as { data: [...] }
      if (resCashflow?.data?.data) {
        const cf = resCashflow.data.data;
        setCashflowData(Array.isArray(cf) ? cf : []);
      }
      
      // Categories: backend wraps as { data: { data: [...], total } }
      if (resCats?.data?.data) {
        const catPayload = resCats.data.data;
        const catArr = Array.isArray(catPayload?.data) ? catPayload.data
          : (Array.isArray(catPayload) ? catPayload : []);
        setCategoryData(catArr);
      }
      
      // Filter budgets for active cashbook
      if (resBudgets?.data?.data) {
        const budgets = resBudgets.data.data.filter(b => b.cashbookId === bookId || !b.cashbookId);
        
        // fetch progress for each
        const withProgress = await Promise.all(budgets.map(async (b) => {
          const p = await api.get(`/budgets/${b.id}/progress`).catch(()=>null);
          return p?.data?.data ? p.data.data : { budget: b, spent: 0, percentage: 0, isOver: false };
        }));
        setBudgetsData(withProgress);
      }

    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoadingBackend(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeBook?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTransactions();
    await fetchData();
    setRefreshing(false);
  };

  const bookTxs = useMemo(() => {
    if (!transactions) return [];
    if (!activeBook?.id) return transactions;
    return transactions.filter(t => t.cashbookId === activeBook.id || !t.cashbookId);
  }, [transactions, activeBook?.id]);

  const localAnalytics = useMemo(() => {
    const merchantMap = {};
    const dowMap = { 'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 };
    const dowLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(new Date().getDate() - 30);

    bookTxs.forEach(t => {
      const d = new Date(t.date || t.createdAt);
      if (d >= thirtyDaysAgo && t.type === 'EXPENSE') {
        const amt = parseFloat(t.amount || 0);
        
        // Merchant
        if (t.merchant || t.payee) {
          const m = t.merchant || t.payee;
          merchantMap[m] = (merchantMap[m] || 0) + amt;
        }

        // DOW
        const dayName = dowLabels[d.getDay()];
        dowMap[dayName] = (dowMap[dayName] || 0) + amt;
      }
    });

    const topMerchants = Object.entries(merchantMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));

    const dowData = dowLabels.map(l => dowMap[l]);

    // For AI trend avg daily
    const recentExpenses = bookTxs.filter(t => t.type === 'EXPENSE' && new Date(t.date) >= thirtyDaysAgo);
    const avgDaily = recentExpenses.reduce((acc, t) => acc + parseFloat(t.amount || 0), 0) / 30;

    return { topMerchants, dowLabels, dowData, avgDaily };
  }, [bookTxs]);


  // AI Chart Data (Computed from real cashflow Data)
  const aiChartData = useMemo(() => {
    const defaultLabels = ['-6d', '-5d', '-4d', '-3d', '-2d', '-1d', 'Today', '+1d', '+2d'];
    
    let actual = [0,0,0,0,0,0,0];
    if (cashflowData && cashflowData.length >= 7) {
       actual = cashflowData.slice(-7).map(c => Number(c.expense) || 0);
    } else if (cashflowData && cashflowData.length > 0) {
       const pad = Array(7 - cashflowData.length).fill(0);
       actual = [...pad, ...cashflowData.map(c => Number(c.expense) || 0)];
    }

    // Create an accumulated trend so it's not flat at 0
    let acc = 0;
    const accumActual = actual.map(v => { acc += v; return acc; });
    const lastDayVal = accumActual[6] || 0;
    
    // Average daily expense to project forward
    const avgDaily = lastDayVal / 7 || 0;
    const proj1 = lastDayVal + avgDaily;
    const proj2 = proj1 + avgDaily;
    
    // To make the chart look connected without dropping to 0, we pad actual with lastDayVal
    // and we pad forecast with 0s until Today, then we start forecast from lastDayVal
    return {
      labels: defaultLabels,
      actualSeries: [...accumActual, lastDayVal, lastDayVal],
      forecastSeries: [0, 0, 0, 0, 0, 0, lastDayVal, proj1, proj2]
    };
  }, [cashflowData]);


  // Pie Chart Data
  const pieColors = ['#2D8CFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'];
  const pieData = categoryData.length > 0 
    ? categoryData.slice(0,6).map((c, i) => ({
        name: c.category?.name || 'Unknown',
        population: Number(c.amount) || 0,
        color: pieColors[i % pieColors.length],
        legendFontColor: '#4B5563',
        legendFontSize: 12
      }))
    : [{ name: 'No Data', population: 1, color: '#E5E7EB', legendFontColor: '#9CA3AF', legendFontSize: 12 }];

  // 7-Day Bar chart - shows both income and expense
  const barLabels = cashflowData.length > 0 ? cashflowData.slice(-7).map(c => c.label) : ['M','T','W','T','F','S','S'];
  const barExpenseData = cashflowData.length > 0 ? cashflowData.slice(-7).map(c => Number(c.expense) || 0) : [0,0,0,0,0,0,0];
  const barData = {
    labels: barLabels,
    datasets: [
      { data: barExpenseData }
    ]
  };
  
  const summary = dashboardData?.summary || null;

  const hasEnoughData = bookTxs.length > 5;

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    propsForDots: { r: '4', strokeWidth: '2', stroke: '#ffffff' },
    propsForBackgroundLines: { strokeDasharray: '', stroke: 'rgba(0,0,0,0.05)' },
    formatYLabel: (y) => formatCompact(Number(y))
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color="#1E293B" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>AI Analytics & Insights</Text>
          <Text style={styles.headerSub}>
            {activeBook ? `${activeBook.name} • ${cur}` : `All Cashbooks • ${cur}`}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.container} contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2D8CFF']} />}
      >
        {/* SECTION A - AI (Strictly 1 Chart + 1 Insight) */}
        <View style={styles.aiSection}>
          <View style={styles.aiHeader}>
            <View style={styles.aiBadge}>
              <Feather name="cpu" size={16} color="#2D8CFF" />
              <Text style={styles.aiBadgeText}>AI ACCUMULATED INSIGHT</Text>
            </View>
          </View>
          
          <View style={[styles.card, { padding: 0, overflow: 'hidden', paddingTop: 14, paddingBottom: 14 }]}>
            <Text style={[styles.cardTitle, { paddingHorizontal: 14 }]}>Accumulated Trend vs AI Forecast ({sym})</Text>
            {loadingBackend ? (
              <View style={styles.skeletonChart}><ActivityIndicator color="#2D8CFF" /></View>
            ) : hasEnoughData ? (
              <LineChart
                data={{
                  labels: aiChartData.labels,
                  datasets: [
                    { data: aiChartData.actualSeries, color: () => '#10B981', strokeWidth: 3.5 },
                    { data: aiChartData.forecastSeries, color: () => '#F97316', strokeWidth: 3.5 }
                  ],
                  legend: ["Actual Trend", "AI Forecast"]
                }}
                width={screenWidth - 44}
                height={200}
                withDots={false}
                chartConfig={chartConfig}
                bezier
                style={styles.chartStyle}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Add more transactions this month to unlock AI forecasting.</Text>
              </View>
            )}
            
            <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
              <Text style={styles.aiInsightText}>
                {loadingBackend ? "Generating insight..." : (aiInsightText || "Insufficient data for a meaningful forecast. Keep logging your daily expenses.")}
              </Text>
              {!loadingBackend && hasEnoughData && (
                 <TouchableOpacity style={styles.actionBtn}>
                   <Text style={styles.actionBtnText}>Set Budget Cap</Text>
                 </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* SECTION B - Real Data */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Visual Analytics</Text>
          <Text style={styles.sectionSub}>Deterministic reporting from your records</Text>
        </View>

        {/* 1. Category Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Expense by Category ({sym})</Text>
          {loadingBackend ? (
             <View style={styles.skeletonChart}><ActivityIndicator color="#2D8CFF" /></View>
          ) : categoryData.length > 0 ? (
            <View>
              <View style={{ alignItems: 'center', marginLeft: -30 }}>
                <PieChart
                  data={pieData}
                  width={screenWidth - 44}
                  height={180}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="0"
                  center={[screenWidth / 4, 0]}
                  hasLegend={false}
                  absolute
                />
              </View>
              <View style={styles.legendContainer}>
                 {categoryData.slice(0, 6).map((c, i) => (
                   <View key={i} style={styles.legendRow}>
                      <View style={{flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10}}>
                         <View style={[styles.legendDot, {backgroundColor: pieColors[i % pieColors.length]}]} />
                         <Text style={styles.legendName} numberOfLines={1}>{c.category?.name || 'Uncategorized'}</Text>
                      </View>
                      <Text style={styles.legendAmt}>{sym}{formatCompact(Number(c.amount))}</Text>
                   </View>
                 ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Add a few transactions to see your category breakdown.</Text>
            </View>
          )}
        </View>

        {/* 2. 7-Day Income vs Expense */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>7-Day Expense Flow ({sym})</Text>
          {loadingBackend ? (
            <View style={styles.skeletonChart}><ActivityIndicator color="#2D8CFF" /></View>
          ) : cashflowData.length > 0 ? (
            <BarChart
              data={barData}
              width={screenWidth - 44}
              height={220}
              chartConfig={{...chartConfig, color: () => '#EF4444' }}
              style={styles.chartStyle}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent expense flow to display.</Text>
            </View>
          )}
        </View>

        {/* 3. Spending by Day of Week */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>30-Day Spending by Day-of-Week</Text>
          {localAnalytics.dowData.some(v => v > 0) ? (
            <BarChart
              data={{ labels: localAnalytics.dowLabels, datasets: [{ data: localAnalytics.dowData }] }}
              width={screenWidth - 44}
              height={200}
              chartConfig={{...chartConfig, color: () => '#8B5CF6'}}
              style={styles.chartStyle}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Not enough data to analyze weekly habits.</Text>
            </View>
          )}
        </View>

        {/* 4. Top Merchants */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Merchants (30 Days)</Text>
          {localAnalytics.topMerchants.length > 0 ? (
            localAnalytics.topMerchants.map((m, i) => (
              <View key={i} style={styles.merchantRow}>
                <Text style={styles.merchantName}>{i+1}. {m.name}</Text>
                <Text style={styles.merchantAmt}>{sym}{m.amount.toLocaleString()}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No payee/merchant data logged recently.</Text>
            </View>
          )}
        </View>

        {/* 5. Month-over-Month & Cash Flow Health */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Savings & Cash Flow Health</Text>
          {loadingBackend ? (
            <View style={styles.skeletonChart}><ActivityIndicator color="#2D8CFF" /></View>
          ) : summary ? (
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Income</Text>
                <Text style={[styles.statVal, { color: '#10B981' }]}>{sym}{Number(summary.income || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Expenses</Text>
                <Text style={[styles.statVal, { color: '#EF4444' }]}>{sym}{Number(summary.expense || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Net Savings</Text>
                <Text style={[styles.statVal, { color: summary.savings >= 0 ? '#10B981' : '#EF4444' }]}>
                  {sym}{Number(summary.savings || 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Savings Rate</Text>
                <Text style={styles.statVal}>{summary.savingsRate ?? 0}%</Text>
              </View>
              {summary.expenseChange !== 0 && (
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>vs Last Month</Text>
                  <Text style={[styles.statVal, { color: summary.expenseChange > 0 ? '#EF4444' : '#10B981' }]}>
                    {summary.expenseChange > 0 ? '+' : ''}{summary.expenseChange}%
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
               <Text style={styles.emptyStateText}>No cash flow data available.</Text>
            </View>
          )}
        </View>

        {/* 6. Budgets vs Actual */}
        {budgetsData.length > 0 && (
          <View style={styles.card}>
             <Text style={styles.cardTitle}>Budget vs Actual</Text>
             {budgetsData.map((b, i) => (
               <View key={i} style={styles.budgetRow}>
                 <View style={styles.budgetHeader}>
                    <Text style={styles.budgetName}>{b.budget.name}</Text>
                    <Text style={styles.budgetAmt}>{sym}{b.spent.toLocaleString()} / {sym}{Number(b.budget.amount).toLocaleString()}</Text>
                 </View>
                 <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${Math.min(b.percentage, 100)}%`, backgroundColor: b.isOver ? '#EF4444' : '#10B981' }]} />
                 </View>
               </View>
             ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  headerSub: { fontSize: 12, color: '#64748B' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  aiSection: { marginBottom: 24 },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  aiBadgeText: { fontSize: 11, fontWeight: '700', color: '#2D8CFF', letterSpacing: 0.5 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
  chartStyle: { marginVertical: 8, borderRadius: 16 },
  aiInsightText: { fontSize: 14, color: '#334155', lineHeight: 22, fontStyle: 'italic' },
  actionBtn: { marginTop: 12, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#EFF6FF', borderRadius: 8 },
  actionBtnText: { color: '#2D8CFF', fontSize: 13, fontWeight: '600' },
  skeletonChart: { height: 180, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12 },
  emptyState: { padding: 20, alignItems: 'center' },
  emptyStateText: { color: '#64748B', fontSize: 14, textAlign: 'center' },
  sectionHeader: { marginBottom: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  sectionSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  merchantRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  merchantName: { fontSize: 15, color: '#334155' },
  merchantAmt: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBox: { flex: 1, minWidth: '45%', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8 },
  statLabel: { fontSize: 13, color: '#64748B', marginBottom: 4 },
  statVal: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  budgetRow: { marginBottom: 16 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  budgetName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  budgetAmt: { fontSize: 13, color: '#64748B' },
  progressBarBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  legendContainer: { marginTop: 12 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendName: { fontSize: 13, color: '#4B5563' },
  legendAmt: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
});
