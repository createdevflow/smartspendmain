// screens/TransactionsScreen.js — Premium redesign
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, UIManager, FlatList, Modal, Pressable, RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useBooks } from '../context/BooksContext';
import { useTransactions } from '../context/TransactionsContext';
import { exportTransactionsCSV, generateInvoicePdf } from '../utils/reporting';
import QuickEntrySheet from '../components/QuickEntrySheet';
import TxCard from '../components/TxCard';
import { getCurrencySymbol } from '../utils/planFeatures';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import InvoiceTicket from '../components/InvoiceTicket';
import ExportOptionsModal from '../components/ExportOptionsModal';
import { BlurView } from 'expo-blur';
import { useRef } from 'react';
import SchedulerModal from '../components/SchedulerModal';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { TourStep, useTourGuide } from '../components/onboarding/TourGuide';
import { useOnboarding } from '../context/OnboardingContext';
import { useEffect } from 'react';
import { useAppTheme } from '../context/ThemeContext';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental &&
  !global?._IS_FABRIC
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


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



// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function TransactionsScreen() {
  const { isDark } = useAppTheme();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { activeBook, loading: booksLoading, refreshBooks } = useBooks();
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    privateMode,
    maskCurrency,
    gstEnabled,
    refreshTransactions,
    loading: txLoading,
  } = useTransactions();

  useEffect(() => {
    if (isFocused) {
      refreshTransactions();
      if (refreshBooks) refreshBooks();
    }
  }, [isFocused, refreshTransactions, refreshBooks]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshTransactions();
    if (refreshBooks) await refreshBooks();
    setRefreshing(false);
  }, [refreshTransactions, refreshBooks]);

  const [editData, setEditData] = useState(null);
  const quickEntryRef = useRef(null);
  const exportModalRef = useRef(null);
  const [sheetType, setSheetType] = useState('out');

  const invoiceRef = useRef();
  const [lastSavedTx, setLastSavedTx] = useState(null);

  const PAGE_SIZE = 10;

  const [typeFilter, setTypeFilter] = useState('all');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [invoiceMenuTx, setInvoiceMenuTx] = useState(null);

  // Scheduler
  const { hasAccess } = useFeatureAccess();
  const schedulerEnabled = hasAccess('scheduled_communications');
  const [schedulerTx, setSchedulerTx] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);

  // Tour hooks
  const { startTour, activeTour, endTour } = useTourGuide();
  const { shouldShowTour, markTourSeen } = useOnboarding();

  const currencySymbol = getCurrencySymbol(activeBook ? activeBook.currency : null);

  const bookTransactions = useMemo(() => {
    if (!activeBook) {
      return [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return transactions
      .filter((t) => !t.cashbookId || t.cashbookId === activeBook.id || activeBook.isDefault || activeBook.name?.includes('General'))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, activeBook]);

  const filteredTransactions = useMemo(() => {
    let list = [...bookTransactions];
    if (typeFilter !== 'all') {
      const mapped = typeFilter === 'in' ? 'INCOME' : 'EXPENSE';
      list = list.filter((t) => t.type === mapped);
    }
    if (fromDate) {
      const min = new Date(fromDate); min.setHours(0, 0, 0, 0);
      list = list.filter((t) => new Date(t.date) >= min);
    }
    if (toDate) {
      const max = new Date(toDate); max.setHours(23, 59, 59, 999);
      list = list.filter((t) => new Date(t.date) <= max);
    }
    return list;
  }, [bookTransactions, typeFilter, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));

  // Reset to page 1 when filters change
  React.useEffect(() => { setCurrentPage(1); }, [typeFilter, fromDate, toDate, activeBook]);

  // Trigger tour when visiting screen
  useEffect(() => {
    if (isFocused && shouldShowTour('after_first_tx')) {
      const t = setTimeout(() => { startTour('after_first_tx'); markTourSeen('after_first_tx'); }, 800);
      return () => clearTimeout(t);
    }
  }, [isFocused, shouldShowTour, startTour, markTourSeen]);

  useEffect(() => {
    if (!isFocused && activeTour === 'after_first_tx') endTour();
  }, [isFocused, activeTour, endTour]);

  const shownTransactions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTransactions.slice(start, start + PAGE_SIZE);
  }, [filteredTransactions, currentPage]);

  const handleOpenAdd = (type) => {
    setEditData(null);
    setSheetType(type);
    quickEntryRef.current?.present();
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction permanently?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(id) }
      ]
    );
  };

  const handleSave = (data) => {
    const payload = {
      bookId: activeBook.id,
      type: data.type,
      amount: data.amount,
      currency: activeBook ? activeBook.currency : 'INR',
      date: data.date,
      category: data.category,
      note: data.note,
      paymentMethod: data.paymentMethod,
      isGstApplied: data.isGstApplied,
      gstRate: data.gstRate,
      cgst: data.cgst,
      sgst: data.sgst,
      igst: data.igst,
      isTaxDeductible: data.isTaxDeductible,
    };
    if (editData?.id) {
      updateTransaction(editData.id, payload);
    } else {
      addTransaction(payload);
    }
  };

  const triggerExport = (format) => {
    // Left as legacy but now unused, button below uses exportModalRef directly
  };
  
  const handleExportConfirm = ({ type, startDate, endDate, format }) => {
    // 1. Start with base list based on current activeBook
    let list = [...bookTransactions];
    
    // 2. Filter by type (income/expense)
    if (type !== 'all') {
      const mapped = type === 'in' ? 'INCOME' : 'EXPENSE';
      list = list.filter(t => t.type === mapped);
    }
    
    // 3. Filter by date range
    if (startDate) {
      const min = new Date(startDate); min.setHours(0, 0, 0, 0);
      list = list.filter(t => new Date(t.date) >= min);
    }
    if (endDate) {
      const max = new Date(endDate); max.setHours(23, 59, 59, 999);
      list = list.filter(t => new Date(t.date) <= max);
    }

    // 4. Generate the export
    if (format === 'csv') {
      exportTransactionsCSV(list);
    } else {
      generateInvoicePdf(activeBook, list);
    }
  };
  const openDatePicker = (field) => {
    setDatePickerField(field);
    setShowDatePicker(true);
  };

  const onDateChange = (event, selected) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (!selected) return;
    if (datePickerField === 'from') setFromDate(selected);
    if (datePickerField === 'to') setToDate(selected);
  };

  // ─── Balance summary ──────────────────────────────────────────────────────
  const inTotal = bookTransactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const outTotal = bookTransactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const balance = inTotal - outTotal;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, isDark && { backgroundColor: '#0F172A' }]} edges={['top']}>
      <View style={[styles.container, isDark && { backgroundColor: '#0F172A' }]}>
        {!activeBook ? (
          <View style={[styles.emptyState, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }]}>
            <Text style={styles.emptyIcon}>📒</Text>
            <Text style={[styles.emptyTitle, isDark && { color: '#F8FAFC' }]}>No active cashbook</Text>
            <Text style={[styles.emptyText, isDark && { color: '#94A3B8' }]}>Create a cashbook from the Home tab to start recording entries.</Text>
          </View>
        ) : (
          <>
            {/* ── Header ── */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.title, isDark && { color: '#F8FAFC' }]}>Transactions</Text>
                <Text style={[styles.subtitle, isDark && { color: '#94A3B8' }]}>{activeBook.name}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TourStep id="tx_export">
                  <TouchableOpacity style={[styles.filterToggleBtn, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)' }]} onPress={() => exportModalRef.current?.present?.()}
                  >
                    <Feather name="download" size={18} color={isDark ? "#CBD5E1" : "#747487"} />
                  </TouchableOpacity>
                </TourStep>
                <TourStep id="tx_wealth">
                  <TouchableOpacity style={[styles.filterToggleBtn, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)' }]} onPress={() => navigation.navigate('Wealth')}>
                    <Feather name="trending-up" size={18} color={isDark ? "#CBD5E1" : "#747487"} />
                  </TouchableOpacity>
                </TourStep>
                <TourStep id="tx_invoice">
                  <TouchableOpacity style={[styles.filterToggleBtn, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)' }]} onPress={() => navigation.navigate('Invoices')}>
                    <Feather name="file-text" size={18} color={isDark ? "#CBD5E1" : "#747487"} />
                  </TouchableOpacity>
                </TourStep>
              </View>
            </View>

            {/* ── Balance summary strip ── */}
            <View style={[styles.summaryStrip, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }]}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, isDark && { color: '#94A3B8' }]}>Balance</Text>
                <Text style={[styles.summaryVal, { color: balance >= 0 ? '#16A34A' : '#DC2626' }]} numberOfLines={1} adjustsFontSizeToFit>
                  {privateMode ? maskCurrency(balance, currencySymbol) : `${currencySymbol}${Math.abs(balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, isDark && { color: '#94A3B8' }]}>In</Text>
                <Text style={[styles.summaryVal, { color: '#16A34A' }]} numberOfLines={1} adjustsFontSizeToFit>
                  {privateMode ? maskCurrency(inTotal, currencySymbol, '+') : `+${currencySymbol}${inTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, isDark && { color: '#94A3B8' }]}>Out</Text>
                <Text style={[styles.summaryVal, { color: '#DC2626' }]} numberOfLines={1} adjustsFontSizeToFit>
                  {privateMode ? maskCurrency(outTotal, currencySymbol, '−') : `−${currencySymbol}${outTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </Text>
              </View>
            </View>

            {/* ── Type filter chips ── */}
            <View style={{ marginHorizontal: 20, marginBottom: 12 }}>
              <TourStep id="tx_search">
                <View style={[styles.filterRow, { paddingHorizontal: 0, marginBottom: 0 }]}>
                  <TouchableOpacity 
                    style={[styles.filterToggleBtn, { paddingHorizontal: 12, marginRight: 8, backgroundColor: showFilters ? (isDark ? 'rgba(45,140,255,0.3)' : '#EFF6FF') : (isDark ? '#1E293B' : '#F9FAFB') }, isDark && { borderColor: 'rgba(255,255,255,0.1)' }]} 
                    onPress={() => setShowFilters(v => !v)}
                  >
                    <Feather name="sliders" size={16} color={showFilters ? "#2D8CFF" : "#747487"} />
                  </TouchableOpacity>
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'in',  label: '↓ Cash In' },
                    { key: 'out', label: '↑ Cash Out' },
                  ].map(({ key, label }) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.filterChip,
                        isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)' },
                        typeFilter === key && styles.filterChipActive,
                        typeFilter === key && key === 'in' && (isDark ? { backgroundColor: 'rgba(22,163,74,0.2)', borderColor: '#16A34A' } : styles.filterChipIn),
                        typeFilter === key && key === 'out' && (isDark ? { backgroundColor: 'rgba(220,38,38,0.2)', borderColor: '#DC2626' } : styles.filterChipOut),
                      ]}
                      onPress={() => setTypeFilter(key)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        isDark && { color: '#94A3B8' },
                        typeFilter === key && styles.filterChipTextActive,
                        typeFilter === key && key === 'in' && { color: '#16A34A' },
                        typeFilter === key && key === 'out' && { color: '#DC2626' },
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {/* Date range buttons */}
                  {showFilters && (
                    <>
                      <TouchableOpacity style={[styles.dateChip, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)' }]} onPress={() => openDatePicker('from')}>
                        <Feather name="calendar" size={12} color={isDark ? "#94A3B8" : "#747487"} />
                        <Text style={[styles.dateChipText, isDark && { color: '#F8FAFC' }]}>{fromDate ? formatDate(fromDate) : 'From'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.dateChip, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)' }]} onPress={() => openDatePicker('to')}>
                        <Feather name="calendar" size={12} color={isDark ? "#94A3B8" : "#747487"} />
                        <Text style={[styles.dateChipText, isDark && { color: '#F8FAFC' }]}>{toDate ? formatDate(toDate) : 'To'}</Text>
                      </TouchableOpacity>
                      {(fromDate || toDate) && (
                        <TouchableOpacity onPress={() => { setFromDate(null); setToDate(null); }}>
                          <Text style={{ color: '#2D8CFF', fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Clear</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              </TourStep>
            </View>

            {/* ── Transaction list ── */}
            <TourStep id="tx_list" style={{ flex: 1 }}>
              <FlatList
                data={shownTransactions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TxCard
                    t={item}
                    currencySymbol={currencySymbol}
                    privateMode={privateMode}
                    onEdit={activeBook?.memberRole === 'VIEWER' ? null : (tx) => {
                      setEditData(tx);
                      setSheetType(tx.type === 'INCOME' ? 'in' : 'out');
                      quickEntryRef.current?.present();
                    }}
                    onDelete={activeBook?.memberRole === 'VIEWER' ? null : (id) => handleDelete(id)}
                    onInvoice={(t) => setInvoiceMenuTx(t)}
                    onSchedule={schedulerEnabled ? (t) => { setSchedulerTx(t); setShowScheduler(true); } : null}
                  />
                )}
                contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D8CFF" />}
                ListEmptyComponent={() => (
                  (booksLoading || txLoading) ? (
                    <View style={{ gap: 12 }}>
                      <View style={{ width: '100%', height: 100, backgroundColor: '#E2E8F0', borderRadius: 20 }} />
                      <View style={{ width: '100%', height: 100, backgroundColor: '#E2E8F0', borderRadius: 20 }} />
                      <View style={{ width: '100%', height: 100, backgroundColor: '#E2E8F0', borderRadius: 20 }} />
                    </View>
                  ) : (
                    <View style={[styles.emptyListCard, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }]}>
                      <View style={{ width: 64, height: 64, backgroundColor: isDark ? 'rgba(45,140,255,0.2)' : '#EFF6FF', borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <Text style={{ fontSize: 32 }}>💸</Text>
                      </View>
                      <Text style={[styles.emptyListTitle, isDark && { color: '#F8FAFC' }]}>No transactions yet</Text>
                      <Text style={[styles.emptyListText, isDark && { color: '#94A3B8' }]}>Your cashbook is empty. Record your first expense or income to get started.</Text>
                      
                      {(!activeBook || activeBook.memberRole !== 'VIEWER') && (
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                          <TouchableOpacity 
                            style={{ flex: 1, backgroundColor: '#DC2626', paddingVertical: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                            onPress={() => { setSheetType('out'); quickEntryRef.current?.present(); }}
                          >
                            <Feather name="minus" size={16} color="#fff" />
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Expense</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={{ flex: 1, backgroundColor: '#16A34A', paddingVertical: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                            onPress={() => { setSheetType('in'); quickEntryRef.current?.present(); }}
                          >
                            <Feather name="plus" size={16} color="#fff" />
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Income</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )
                )}
                ListFooterComponent={() => (
                  <>
                    {/* Pagination controls */}
                    {filteredTransactions.length > PAGE_SIZE && (
                      <View style={styles.paginationRow}>
                        <TouchableOpacity
                          style={[styles.pageBtn, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)' }, currentPage === 1 && styles.pageBtnDisabled]}
                          onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <Feather name="chevron-left" size={16} color={currentPage === 1 ? '#CBD5E1' : '#2D8CFF'} />
                          <Text style={[styles.pageBtnText, isDark && { color: '#F8FAFC' }, currentPage === 1 && styles.pageBtnTextDisabled]}>Prev</Text>
                        </TouchableOpacity>

                        <View style={styles.pageIndicator}>
                          <Text style={[styles.pageIndicatorText, isDark && { color: '#F8FAFC' }]}>
                            {currentPage} / {totalPages}
                          </Text>
                          <Text style={[styles.pageIndicatorSub, isDark && { color: '#94A3B8' }]}>
                            {filteredTransactions.length} total
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={[styles.pageBtn, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)' }, currentPage === totalPages && styles.pageBtnDisabled]}
                          onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <Text style={[styles.pageBtnText, isDark && { color: '#F8FAFC' }, currentPage === totalPages && styles.pageBtnTextDisabled]}>Next</Text>
                          <Feather name="chevron-right" size={16} color={currentPage === totalPages ? '#CBD5E1' : '#2D8CFF'} />
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Export card */}
                    <View style={[styles.exportCard, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }]}>
                      <Text style={[styles.exportTitle, isDark && { color: '#F8FAFC' }]}>Export & Reports</Text>
                      <View style={styles.exportBtns}>
                        <TouchableOpacity
                          style={[
                            styles.exportBtn,
                            {
                              flex: 1,
                              backgroundColor: isDark ? 'rgba(45, 140, 255, 0.18)' : '#EFF6FF',
                              borderColor: isDark ? 'rgba(45, 140, 255, 0.35)' : '#BFDBFE'
                            }
                          ]}
                          onPress={() => exportModalRef.current?.present()}
                        >
                          <Feather name="download" size={16} color={isDark ? '#60A5FA' : '#2D8CFF'} />
                          <Text style={[styles.exportBtnText, { color: isDark ? '#60A5FA' : '#2D8CFF' }]}>Export Transactions</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                )}
              />
            </TourStep>

            {/* ── Bottom CTA buttons ── */}
            {(!activeBook || activeBook.memberRole !== 'VIEWER') && (
              <View style={styles.fabContainer}>
                <TouchableOpacity style={[styles.fabBtn, styles.fabOut]} onPress={() => handleOpenAdd('out')} activeOpacity={0.9}>
                  <Feather name="minus" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.fabText}>Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.fabBtn, styles.fabIn]} onPress={() => handleOpenAdd('in')} activeOpacity={0.9}>
                  <Feather name="plus" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.fabText}>Income</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      {/* Offscreen Invoice Ticket for sharing */}
      <View style={{ position: 'absolute', left: -9999, top: 0 }}>
        <InvoiceTicket ref={invoiceRef} transaction={lastSavedTx} />
      </View>

      {/* Date picker (for filter) */}
      {showDatePicker && Platform.OS === 'ios' ? (
        <Modal transparent animationType="fade" visible={showDatePicker} onRequestClose={() => setShowDatePicker(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowDatePicker(false)} />
          <View style={styles.datePickerModalOverlay}>
            <View style={styles.datePickerModalContainer}>
              <View style={styles.datePickerModalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={{ alignItems: 'center', paddingBottom: 24, paddingTop: 8 }}>
                <DateTimePicker
                  value={datePickerField === 'from' ? (fromDate || new Date()) : (toDate || new Date())}
                  mode="date"
                  display="inline"
                  onChange={onDateChange}
                  style={{ width: 320, height: 330 }}
                  textColor="#000000"
                  themeVariant="light"
                />
              </View>
            </View>
          </View>
        </Modal>
      ) : showDatePicker && Platform.OS === 'android' ? (
        <DateTimePicker
          value={datePickerField === 'from' ? (fromDate || new Date()) : (toDate || new Date())}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      ) : null}

      {/* Invoice Menu Tooltip */}
      <Modal visible={!!invoiceMenuTx} transparent animationType="fade" onRequestClose={() => setInvoiceMenuTx(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setInvoiceMenuTx(null)} />
        <View style={[styles.tooltipMenu, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }]}>
          <Text style={[styles.tooltipTitle, isDark && { color: '#94A3B8', borderBottomColor: 'rgba(255,255,255,0.1)' }]}>Transaction Options</Text>
          <TouchableOpacity style={styles.menuItem} onPress={async () => {
            const tx = invoiceMenuTx;
            setInvoiceMenuTx(null);
            setLastSavedTx(tx);
            setTimeout(async () => {
              if (invoiceRef.current) {
                try {
                  const uri = await invoiceRef.current.capture();
                  if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, { dialogTitle: 'Share Cashtro Receipt' });
                  }
                } catch (e) {
                  console.error(e);
                }
              }
            }, 500);
          }}>
            <Feather name="share-2" size={18} color={isDark ? '#F8FAFC' : '#232333'} />
            <Text style={[styles.menuText, isDark && { color: '#F8FAFC' }]}>Share Receipt Image</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={async () => {
            const tx = invoiceMenuTx;
            setInvoiceMenuTx(null);
            await generateInvoicePdf(activeBook, [tx]);
          }}>
            <Feather name="download" size={18} color={isDark ? '#F8FAFC' : '#232333'} />
            <Text style={[styles.menuText, isDark && { color: '#F8FAFC' }]}>Download PDF</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Quick Entry Sheet */}
      <QuickEntrySheet
        ref={quickEntryRef}
        onClose={() => { quickEntryRef.current?.dismiss(); setEditData(null); }}
        onSave={handleSave}
        editData={editData}
        defaultType={sheetType}
      />
      
      <ExportOptionsModal 
        ref={exportModalRef} 
        onExport={handleExportConfirm} 
      />

      {/* Scheduler Modal */}
      <SchedulerModal
        visible={showScheduler}
        onClose={() => { setShowScheduler(false); setSchedulerTx(null); }}
        transaction={schedulerTx}
        defaultType="email"
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F9FC' },
  container: { flex: 1 },

  // Empty state
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#232333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#747487', textAlign: 'center', lineHeight: 22 },
  dateText: { fontSize: 16, color: '#232333' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  tooltipMenu: {
    position: 'absolute', top: '40%', left: '10%', right: '10%',
    backgroundColor: '#fff', borderRadius: 16, padding: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1, shadowRadius: 24, elevation: 20,
  },
  tooltipTitle: { fontSize: 14, fontWeight: '700', color: '#747487', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginBottom: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  menuText: { fontSize: 16, color: '#232333', fontWeight: '500' },
  
  // Date Picker Modal
  datePickerModalOverlay: { flex: 1, justifyContent: 'flex-end' },
  datePickerModalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: Platform.OS === 'ios' ? 20 : 0 },
  datePickerModalHeader: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  datePickerDoneText: { color: '#2D8CFF', fontSize: 16, fontWeight: '700' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#232333', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#747487', marginTop: 2 },
  filterToggleBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
  },

  // Summary strip
  summaryStrip: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#fff', borderRadius: 24, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04, shadowRadius: 16, elevation: 2,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
  },
  summaryItem: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  summaryLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  summaryVal: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },
  summaryDivider: { width: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },

  // Filter row
  filterRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  filterChipActive: { borderColor: '#2D8CFF', backgroundColor: '#EFF6FF' },
  filterChipIn: { borderColor: '#16A34A', backgroundColor: '#DCFCE7' },
  filterChipOut: { borderColor: '#DC2626', backgroundColor: '#FEE2E2' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#747487' },
  filterChipTextActive: { color: '#2D8CFF' },
  dateChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  dateChipText: { fontSize: 12, color: '#747487', fontWeight: '500' },

  // Transaction card
  scroll: { flex: 1, paddingHorizontal: 20 },
  txCard: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 10,
    padding: 14,
  },
  txMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  txEmojiBox: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  txEmoji: { fontSize: 20 },
  txInfo: { flex: 1 },
  txName: { fontSize: 15, fontWeight: '700', color: '#232333' },
  txMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  txNote: { fontSize: 12, color: '#747487', marginTop: 4, fontStyle: 'italic' },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 16, fontWeight: '800', letterSpacing: -0.5 },
  txGstBadge: {
    fontSize: 10, color: '#747487', backgroundColor: '#F3F4F6',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4,
  },
  txActions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  catTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catTagText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  actionIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  actionIconDanger: { backgroundColor: '#FEE2E2' },

  // Empty list
  emptyListCard: {
    alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24,
    backgroundColor: '#fff', borderRadius: 16, marginTop: 8,
  },
  emptyListTitle: { fontSize: 17, fontWeight: '700', color: '#232333', marginBottom: 6 },
  emptyListText: { fontSize: 14, color: '#747487', textAlign: 'center', lineHeight: 22 },

  // Pagination
  paginationRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 14, marginVertical: 10,
    paddingHorizontal: 8, paddingVertical: 6,
    borderWidth: 1, borderColor: '#DBEAFE',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  pageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#EFF6FF',
  },
  pageBtnDisabled: { backgroundColor: '#F9FAFB' },
  pageBtnText: { color: '#2D8CFF', fontWeight: '700', fontSize: 13 },
  pageBtnTextDisabled: { color: '#CBD5E1' },
  pageIndicator: { alignItems: 'center' },
  pageIndicatorText: { fontSize: 14, fontWeight: '700', color: '#232333' },
  pageIndicatorSub: { fontSize: 10, color: '#94A3B8', fontWeight: '500', marginTop: 1 },

  // Export card
  exportCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 8,
    borderWidth: 1, borderColor: '#DBEAFE',
  },
  exportTitle: { fontSize: 13, fontWeight: '600', color: '#232333', marginBottom: 12 },
  exportBtns: { flexDirection: 'row', gap: 10 },
  exportBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 10,
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
  },
  exportBtnText: { color: '#2D8CFF', fontWeight: '700', fontSize: 13 },

  // Floating Action Buttons
  fabContainer: {
    position: 'absolute',
    bottom: 16, left: 20, right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
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
