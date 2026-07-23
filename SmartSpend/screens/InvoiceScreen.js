// screens/InvoiceScreen.js
// Main invoice dashboard — summary stats, filter pills, list of invoices, FAB
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAppTheme } from '../context/ThemeContext';
import { useInvoice } from '../context/InvoiceContext';
import InvoiceCard from '../components/invoice/InvoiceCard';
import { TourStep, useTourGuide } from '../components/onboarding/TourGuide';
import { useOnboarding } from '../context/OnboardingContext';

const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'SENT', label: 'Sent' },
  { key: 'PAID', label: 'Paid' },
  { key: 'OVERDUE', label: 'Overdue' },
  { key: 'PARTIALLY_PAID', label: 'Partial' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

function StatCard({ label, value, color, bg, styles }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {value}
      </Text>
    </View>
  );
}

export default function InvoiceScreen() {
  const { isDark } = useAppTheme();
  const styles = React.useMemo(() => getStyles(isDark), [isDark]);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { invoices, summaryStats, deleteInvoice, duplicateInvoice, isProfileComplete, bizProfile, loading } = useInvoice();

  // Tour hooks
  const { startTour, activeTour, endTour } = useTourGuide();
  const { shouldShowTour, markTourSeen } = useOnboarding();
  useEffect(() => {
    if (isFocused && shouldShowTour('invoice_tour')) {
      const t = setTimeout(() => { startTour('invoice_tour'); markTourSeen('invoice_tour'); }, 800);
      return () => clearTimeout(t);
    }
  }, [isFocused, shouldShowTour, startTour, markTourSeen]);

  useEffect(() => {
    if (!isFocused && activeTour === 'invoice_tour') endTour();
  }, [isFocused, activeTour, endTour]);

  const sym = bizProfile?.currency === 'INR' ? '₹' : (bizProfile?.currency || '₹');
  const fmtExact = useCallback((n) => {
    return `${sym}${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [sym]);

  const [activeFilter, setActiveFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setPage(1);
  }, [activeFilter, search]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const sorted = useMemo(() =>
    [...invoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  [invoices]);

  const filtered = useMemo(() => {
    const now = new Date();
    const query = search.trim().toLowerCase();
    return sorted.filter(inv => {
      // Effective status
      const isOverdue = !['PAID', 'CANCELLED', 'VOID'].includes(inv.status) && inv.dueDate && new Date(inv.dueDate) < now;
      const effectiveStatus = isOverdue ? 'OVERDUE' : inv.status;

      const matchesFilter = activeFilter === 'ALL' || effectiveStatus === activeFilter;
      const matchesSearch = !query || [
        inv.invoiceNumber,
        inv.series,
        inv.client?.name,
        inv.client?.businessName,
        inv.client?.email,
        inv.client?.gstin,
        inv.invoiceDate,
        inv.dueDate,
        inv.status,
        String(inv.grandTotal || ''),
      ].some(f => (f || '').toLowerCase().includes(query));

      return matchesFilter && matchesSearch;
    });
  }, [sorted, activeFilter, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const handleDelete = useCallback((invoice) => {
    Alert.alert(
      `Delete ${invoice.invoiceNumber}?`,
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteInvoice(invoice.id) },
      ]
    );
  }, [deleteInvoice]);

  const handleDuplicate = useCallback(async (invoice) => {
    await duplicateInvoice(invoice.id);
  }, [duplicateInvoice]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Invoices</Text>
          <Text style={styles.subtitle}>{invoices.length} total invoice{invoices.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('InvoiceSettings')}
          >
            <Feather name="settings" size={18} color="#2D8CFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D8CFF" />}
      >
        {/* Profile incomplete banner */}
        {!isProfileComplete && (
          <TouchableOpacity
            style={styles.profileBanner}
            onPress={() => navigation.navigate('InvoiceSettings')}
          >
            <Feather name="alert-circle" size={16} color="#D97706" />
            <Text style={styles.profileBannerText}>
              Complete your business profile to create professional invoices
            </Text>
            <Feather name="chevron-right" size={16} color="#D97706" />
          </TouchableOpacity>
        )}

        {/* Stats */}
        <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
          <TourStep id="invoice_stats">
            <View style={[styles.statsGrid, { paddingHorizontal: 0, marginBottom: 0 }]}>
              <View style={styles.statsGridRow}>
                <StatCard label="Revenue" value={fmtExact(summaryStats.totalRevenue)} color={isDark ? '#4ADE80' : '#15803D'} bg={isDark ? 'rgba(74,222,128,0.1)' : '#DCFCE7'} styles={styles} />
                <StatCard label="Pending" value={fmtExact(summaryStats.totalPending)} color={isDark ? '#FBBF24' : '#B45309'} bg={isDark ? 'rgba(251,191,36,0.1)' : '#FEF3C7'} styles={styles} />
              </View>
              <View style={styles.statsGridRow}>
                <StatCard label="Overdue" value={fmtExact(summaryStats.totalOverdue)} color={isDark ? '#F87171' : '#B91C1C'} bg={isDark ? 'rgba(248,113,113,0.1)' : '#FEE2E2'} styles={styles} />
                <StatCard label="Total" value={String(summaryStats.total)} color={isDark ? '#60A5FA' : '#2D8CFF'} bg={isDark ? 'rgba(96,165,250,0.1)' : '#DBEAFE'} styles={styles} />
              </View>
            </View>
          </TourStep>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Feather name="search" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by invoice #, client..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {!!search && <TouchableOpacity onPress={() => setSearch('')}><Feather name="x" size={16} color="#9CA3AF" /></TouchableOpacity>}
        </View>

        {/* Filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterPill, activeFilter === f.key && styles.filterPillActive]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Invoice List */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={{ width: 64, height: 64, backgroundColor: '#EFF6FF', borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 32 }}>🧾</Text>
            </View>
            <Text style={styles.emptyTitle}>
              {activeFilter === 'ALL' && !search ? 'No invoices yet' : 'No matching invoices'}
            </Text>
            <Text style={styles.emptyText}>
              {activeFilter === 'ALL' && !search
                ? 'Create your first invoice to get started'
                : 'Try adjusting your filters or search query'}
            </Text>
            {activeFilter === 'ALL' && !search && (
              <TourStep id="invoice_create">
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('InvoiceCreate', {})}
              >
                <Feather name="plus" size={16} color="#FFFFFF" />
                <Text style={styles.emptyBtnText}>Create Invoice</Text>
              </TouchableOpacity>
              </TourStep>
            )}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            {paginatedInvoices.map(invoice => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: invoice.id })}
                onEdit={() => navigation.navigate('InvoiceCreate', { invoiceId: invoice.id })}
                onDelete={() => handleDelete(invoice)}
                onDuplicate={() => handleDuplicate(invoice)}
              />
            ))}
            {totalPages > 1 && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                  onPress={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <Feather name="chevron-left" size={18} color={page === 1 ? '#9CA3AF' : '#2D8CFF'} />
                  <Text style={[styles.pageBtnText, page === 1 && { color: '#9CA3AF' }]}>Prev</Text>
                </TouchableOpacity>

                <View style={styles.pageIndicator}>
                  <Text style={styles.pageText}>Page <Text style={styles.pageBold}>{page}</Text> of <Text style={styles.pageBold}>{totalPages}</Text></Text>
                </View>

                <TouchableOpacity
                  style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
                  onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <Text style={[styles.pageBtnText, page === totalPages && { color: '#9CA3AF' }]}>Next</Text>
                  <Feather name="chevron-right" size={18} color={page === totalPages ? '#9CA3AF' : '#2D8CFF'} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      {invoices.length > 0 && (
        <TourStep id="invoice_create">
        <TouchableOpacity
          style={[styles.fab, { bottom: 20 + insets.bottom }]}
          onPress={() => navigation.navigate('InvoiceCreate', {})}
          activeOpacity={0.88}
        >
          <Feather name="plus" size={20} color="#FFFFFF" />
          <Text style={styles.fabText}>New Invoice</Text>
        </TouchableOpacity>
        </TourStep>
      )}
    </SafeAreaView>
  );
}

const getStyles = (isDark) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: isDark ? '#0F172A' : '#F7F9FC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: isDark ? '#F8FAFC' : '#232333', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: isDark ? '#94A3B8' : '#747487', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 10 },
  headerBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: isDark ? 'rgba(45,140,255,0.15)' : '#DBEAFE', alignItems: 'center', justifyContent: 'center' },

  profileBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#FEF3C7', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: isDark ? 'rgba(245,158,11,0.3)' : '#FDE68A',
  },
  profileBannerText: { flex: 1, fontSize: 13, color: isDark ? '#FCD34D' : '#92400E', fontWeight: '600' },

  statsGrid: { paddingHorizontal: 16, marginBottom: 16, gap: 8 },
  statsGridRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, borderRadius: 20, padding: 20, alignItems: 'flex-start', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)' },
  statLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6, opacity: 0.8 },
  statValue: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },

  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderWidth: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB', borderRadius: 16, paddingHorizontal: 16, height: 48, marginHorizontal: 20, marginBottom: 12, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  searchInput: { flex: 1, fontSize: 15, color: isDark ? '#F8FAFC' : '#232333', padding: 0 },

  filtersRow: { paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
  filterPill: { paddingHorizontal: 18, paddingVertical: 10, backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderRadius: 24, borderWidth: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  filterPillActive: { backgroundColor: isDark ? 'rgba(45,140,255,0.3)' : '#EFF6FF', borderColor: isDark ? '#2D8CFF' : '#2D8CFF' },
  filterText: { fontSize: 13, color: isDark ? '#94A3B8' : '#747487', fontWeight: '600' },
  filterTextActive: { color: isDark ? '#2D8CFF' : '#2D8CFF', fontWeight: '700' },

  list: { flex: 1 },
  listContent: { paddingBottom: 100 },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: isDark ? '#F8FAFC' : '#232333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: isDark ? '#94A3B8' : '#747487', textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 24 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2D8CFF', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  fab: { position: 'absolute', right: 16, backgroundColor: '#2D8CFF', borderRadius: 28, height: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#2D8CFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  fabText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 20, paddingHorizontal: 20 },
  pageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: isDark ? '#1E293B' : '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E4E4EC' },
  pageBtnDisabled: { backgroundColor: isDark ? '#0F172A' : '#F9FAFB', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' },
  pageBtnText: { fontSize: 14, fontWeight: '700', color: '#2D8CFF' },
  pageIndicator: { backgroundColor: isDark ? 'rgba(45,140,255,0.15)' : '#DBEAFE', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  pageText: { fontSize: 13, color: '#2D8CFF' },
  pageBold: { fontWeight: '800' },
});
