// context/InvoiceContext.js
// Smart Invoice Management System — Context Layer
// AsyncStorage-backed, with full CRUD for invoices, clients, products & business profile
// Auto-GST calculation (CGST/SGST vs IGST), auto-numbering, ecosystem integration

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './AuthContext';

const InvoiceContext = createContext(null);

// ─── Storage keys (scoped per user) ────────────────────────────────────────
const keys = (userId) => ({
  invoices:        `@cashtro_invoices_${userId}`,
  clients:         `@cashtro_invoice_clients_${userId}`,
  products:        `@cashtro_invoice_products_${userId}`,
  bizProfile:      `@cashtro_biz_profile_${userId}`,
  settings:        `@cashtro_invoice_settings_${userId}`,
  invoiceCounter:  `@cashtro_invoice_counter_${userId}`,
  seriesCounters:  `@cashtro_invoice_series_counters_${userId}`,
});

// ─── Indian amount in words ─────────────────────────────────────────────────
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
  'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function inWords(num) {
  const n = Math.round(num);
  if (n === 0) return 'Zero';
  if (n < 0) return 'Minus ' + inWords(-n);
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
  if (n < 1000) return ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + inWords(n % 100) : '');
  if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
  if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
  return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
}

export function amountInWords(amount, currency = 'INR') {
  const sym = currency === 'INR' ? 'Rupees' : currency;
  const whole = Math.floor(amount);
  const paise = Math.round((amount - whole) * 100);
  let result = `${sym} ${inWords(whole)}`;
  if (paise > 0) result += ` and ${inWords(paise)} Paise`;
  return result + ' Only';
}

// ─── GST Calculation ────────────────────────────────────────────────────────
export function computeInvoiceGst({ sellerState, buyerState, items = [] }) {
  const isIntraState = sellerState && buyerState &&
    sellerState.trim().toLowerCase() === buyerState.trim().toLowerCase();

  let subtotal = 0;
  let totalDiscount = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const processedItems = items.map(item => {
    const qty = parseFloat(item.quantity) || 0;
    const enteredRate = parseFloat(item.rate) || 0;
    const discountPct = parseFloat(item.discount) || 0;
    const gstRate = parseFloat(item.gstRate) || 0;
    const gstIncluded = !!item.gstIncluded;

    const baseRate = gstIncluded && gstRate > 0
      ? (enteredRate * 100) / (100 + gstRate)
      : enteredRate;

    const gross = qty * baseRate;
    const discountAmt = (gross * discountPct) / 100;
    const taxable = gross - discountAmt;
    const totalGstAmt = (taxable * gstRate) / 100;

    let cgst = 0, sgst = 0, igst = 0;
    if (isIntraState) {
      cgst = totalGstAmt / 2;
      sgst = totalGstAmt / 2;
    } else {
      igst = totalGstAmt;
    }

    subtotal += taxable;
    totalDiscount += discountAmt;
    totalCgst += cgst;
    totalSgst += sgst;
    totalIgst += igst;

    return { ...item, baseRate, gross, discountAmt, taxable, cgst, sgst, igst, totalGstAmt, lineTotal: taxable + totalGstAmt };
  });

  const grandTotal = subtotal + totalCgst + totalSgst + totalIgst;

  return {
    isIntraState,
    processedItems,
    subtotal,
    totalDiscount,
    totalCgst,
    totalSgst,
    totalIgst,
    totalGst: totalCgst + totalSgst + totalIgst,
    grandTotal,
  };
}

// ─── Invoice Number Generation ───────────────────────────────────────────────
export function getFinancialYear(dateStr = null) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const year = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
  const month = isNaN(d.getMonth()) ? new Date().getMonth() : d.getMonth(); // 0=Jan, 3=Apr
  if (month >= 3) {
    return `${year}-${String(year + 1).slice(2)}`;
  } else {
    return `${year - 1}-${String(year).slice(2)}`;
  }
}

export function buildInvoiceNumber(seqCounter, settings, series = 'INV', customPrefix = null, dateStr = null) {
  const fy = getFinancialYear(dateStr || new Date().toISOString());
  const fyCompact = fy.length >= 7 ? fy.slice(2, 4) + fy.slice(5, 7) : fy.replace('-', '');
  const s = (series || settings?.defaultSeries || 'INV').toUpperCase().trim();
  const p = customPrefix !== null ? customPrefix : (settings?.businessPrefix || '');
  const prefixPart = p && p.trim() ? `${p.trim()}-` : '';
  const seqPart = String(seqCounter || 1).padStart(4, '0');
  
  return `${prefixPart}${s}-${fyCompact}${seqPart}`;
}

// ─── Default business profile & settings ────────────────────────────────────
const DEFAULT_BIZ_PROFILE = {
  businessName: '',
  proprietorName: '',
  gstin: '',
  pan: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  mobile: '',
  email: '',
  website: '',
  currency: 'INR',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  accountType: 'Current',
  branchName: '',
  upiId: '',
  logoUri: null,
  signatureUri: null,
  defaultNotes: '',
  defaultTerms: 'Payment is due within 30 days of invoice date.\nLate payments may attract interest at 18% per annum.',
};

const DEFAULT_SETTINGS = {
  businessPrefix: '',
  defaultSeries: 'INV',
  invoicePrefix: 'INV',
  invoiceFormat: 'PREFIX-FY-SEQ',
  defaultTheme: 'modern',
  defaultDueDays: 30,
  whiteLabelEnabled: false,
  reminderEnabled: true,
  reminderDaysBefore: [3],
  primaryColor: '#2D8CFF',
  accentColor: '#F26D21',
};

// ─── Status colors ──────────────────────────────────────────────────────────
export const STATUS_META = {
  DRAFT:           { label: 'Draft',          color: '#747487', bg: '#F3F4F6' },
  PENDING:         { label: 'Pending',        color: '#D97706', bg: '#FEF3C7' },
  SENT:            { label: 'Sent',           color: '#2D8CFF', bg: '#EFF6FF' },
  VIEWED:          { label: 'Viewed',         color: '#F26D21', bg: '#FFEDD5' },
  PARTIALLY_PAID:  { label: 'Partial',        color: '#EA580C', bg: '#FFEDD5' },
  PAID:            { label: 'Paid',           color: '#16A34A', bg: '#DCFCE7' },
  OVERDUE:         { label: 'Overdue',        color: '#DC2626', bg: '#FEE2E2' },
  CANCELLED:       { label: 'Cancelled',      color: '#475569', bg: '#F1F5F9' },
  VOID:            { label: 'Void',           color: '#232333', bg: '#E2E8F0' },
};

// ─── Provider ───────────────────────────────────────────────────────────────
export function InvoiceProvider({ children }) {
  const { user } = useContext(AuthContext);
  const K = useMemo(() => (user?.id ? keys(user.id) : null), [user?.id]);

  const [invoices, setInvoices]       = useState([]);
  const [clients, setClients]         = useState([]);
  const [products, setProducts]       = useState([]);
  const [bizProfile, setBizProfile]   = useState(DEFAULT_BIZ_PROFILE);
  const [settings, setSettings]       = useState(DEFAULT_SETTINGS);
  const [counter, setCounter]         = useState(1);
  const [seriesCounters, setSeriesCounters] = useState({});
  const [loading, setLoading]         = useState(true);

  // ── Load all data from AsyncStorage ────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!K) { setLoading(false); return; }
    try {
      const [invRaw, cliRaw, prodRaw, bizRaw, setRaw, cntRaw, serRaw] = await AsyncStorage.multiGet([
        K.invoices, K.clients, K.products, K.bizProfile, K.settings, K.invoiceCounter, K.seriesCounters,
      ]);
      const loadedInvoices = invRaw[1] ? JSON.parse(invRaw[1]) : [];
      let loadedClients = cliRaw[1] ? JSON.parse(cliRaw[1]) : [];

      // Auto-harvest any clients from existing invoices so previous clients are always remembered
      const clientMap = new Map();
      loadedClients.forEach(c => {
        const key = (c.id || c.name || c.businessName || '').toLowerCase().trim();
        if (key) clientMap.set(key, c);
      });
      loadedInvoices.forEach(inv => {
        if (inv.client && (inv.client.name || inv.client.businessName)) {
          const key = (inv.client.id || inv.client.name || inv.client.businessName || '').toLowerCase().trim();
          if (key && !clientMap.has(key)) {
            const harvested = {
              ...inv.client,
              id: inv.client.id || `cli_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              lastUsed: inv.updatedAt || inv.createdAt || new Date().toISOString(),
            };
            clientMap.set(key, harvested);
            loadedClients.push(harvested);
          }
        }
      });

      setInvoices(loadedInvoices);
      setClients(loadedClients);
      if (loadedClients.length !== (cliRaw[1] ? JSON.parse(cliRaw[1]).length : 0)) {
        AsyncStorage.setItem(K.clients, JSON.stringify(loadedClients));
      }
      setProducts(prodRaw[1] ? JSON.parse(prodRaw[1]) : []);
      setBizProfile(bizRaw[1] ? { ...DEFAULT_BIZ_PROFILE, ...JSON.parse(bizRaw[1]) } : DEFAULT_BIZ_PROFILE);
      setSettings(setRaw[1]  ? { ...DEFAULT_SETTINGS, ...JSON.parse(setRaw[1]) }    : DEFAULT_SETTINGS);
      setCounter(cntRaw[1]   ? parseInt(cntRaw[1], 10) : 1);
      setSeriesCounters(serRaw[1] ? JSON.parse(serRaw[1]) : {});
    } catch (e) {
      console.warn('[InvoiceContext] loadAll error:', e);
    } finally {
      setLoading(false);
    }
  }, [K]);

  useEffect(() => { if (user) loadAll(); else setLoading(false); }, [user?.id, loadAll]);

  // ── Persist helpers ─────────────────────────────────────────────────────────
  const saveInvoices  = useCallback(async (data) => { if (K) await AsyncStorage.setItem(K.invoices, JSON.stringify(data)); }, [K]);
  const saveClients   = useCallback(async (data) => { if (K) await AsyncStorage.setItem(K.clients, JSON.stringify(data)); }, [K]);
  const saveProducts  = useCallback(async (data) => { if (K) await AsyncStorage.setItem(K.products, JSON.stringify(data)); }, [K]);
  const saveBizProf   = useCallback(async (data) => { if (K) await AsyncStorage.setItem(K.bizProfile, JSON.stringify(data)); }, [K]);
  const saveSettings_ = useCallback(async (data) => { if (K) await AsyncStorage.setItem(K.settings, JSON.stringify(data)); }, [K]);

  const bumpCounter = useCallback(async () => {
    const next = counter + 1;
    setCounter(next);
    if (K) await AsyncStorage.setItem(K.invoiceCounter, String(next));
    return counter;
  }, [counter, K]);

  // ── Invoice CRUD ────────────────────────────────────────────────────────────
  const getNextInvoiceNumber = useCallback((series = null, dateStr = null) => {
    const s = (series || settings?.defaultSeries || 'INV').toUpperCase().trim();
    const fy = getFinancialYear(dateStr || new Date().toISOString());
    const key = `${fy}_${s}`;
    let seq = seriesCounters[key];
    if (seq === undefined) {
      seq = (s === 'INV' && Object.keys(seriesCounters).length === 0) ? counter : 1;
    } else {
      seq = seq + 1;
    }
    return buildInvoiceNumber(seq, settings, s, null, dateStr);
  }, [seriesCounters, counter, settings]);

  const createInvoice = useCallback(async (data) => {
    const s = (data.series || settings?.defaultSeries || 'INV').toUpperCase().trim();
    const fy = getFinancialYear(data.invoiceDate || new Date().toISOString());
    const key = `${fy}_${s}`;
    let currentSeq = seriesCounters[key];
    if (currentSeq === undefined) {
      currentSeq = (s === 'INV' && Object.keys(seriesCounters).length === 0) ? counter : 1;
    } else {
      currentSeq = currentSeq + 1;
    }
    
    const invNumber = data.invoiceNumber || buildInvoiceNumber(currentSeq, settings, s, null, data.invoiceDate);
    
    // Bump series counter
    const nextCounters = { ...seriesCounters, [key]: currentSeq };
    setSeriesCounters(nextCounters);
    if (K) {
      await AsyncStorage.setItem(K.seriesCounters, JSON.stringify(nextCounters));
      if (s === 'INV') {
        await bumpCounter();
      }
    }

    const gstResult = computeInvoiceGst({
      sellerState: bizProfile.state,
      buyerState: data.client?.state || data.buyerState,
      items: data.items || [],
    });

    const now = new Date().toISOString();
    const invoice = {
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      invoiceNumber: invNumber,
      series: s,
      financialYear: fy,
      sequenceNumber: currentSeq,
      status: data.status || 'DRAFT',
      createdAt: now,
      updatedAt: now,
      dueDate: data.dueDate || null,
      invoiceDate: data.invoiceDate || now.split('T')[0],
      client: data.client || null,
      items: gstResult.processedItems,
      subtotal: gstResult.subtotal,
      totalDiscount: gstResult.totalDiscount,
      totalCgst: gstResult.totalCgst,
      totalSgst: gstResult.totalSgst,
      totalIgst: gstResult.totalIgst,
      totalGst: gstResult.totalGst,
      grandTotal: gstResult.grandTotal,
      isIntraState: gstResult.isIntraState,
      amountInWords: amountInWords(gstResult.grandTotal, bizProfile.currency || 'INR'),
      notes: data.notes || bizProfile.defaultNotes || '',
      terms: data.terms || bizProfile.defaultTerms || '',
      theme: data.theme || settings.defaultTheme || 'modern',
      bizProfile: { ...bizProfile },
      payments: [],
      paidAmount: 0,
      balanceDue: gstResult.grandTotal,
      shippingAddress: data.shippingAddress || null,
      customFields: data.customFields || [],
      po: data.po || '',
    };

    const updated = [invoice, ...invoices];
    setInvoices(updated);
    await saveInvoices(updated);

    // Auto-save or touch client
    if (data.client && (data.client.name || data.client.businessName)) {
      const existingIdx = clients.findIndex(c => (c.id && c.id === data.client.id) || ((c.name || '').toLowerCase().trim() === (data.client.name || '').toLowerCase().trim()));
      let updatedClients;
      if (existingIdx >= 0) {
        updatedClients = [...clients];
        updatedClients[existingIdx] = { ...updatedClients[existingIdx], ...data.client, lastUsed: now };
      } else {
        const newCli = { ...data.client, id: data.client.id || `cli_${Date.now()}`, lastUsed: now };
        updatedClients = [newCli, ...clients];
      }
      setClients(updatedClients);
      await saveClients(updatedClients);
    }

    return invoice;
  }, [invoices, clients, bizProfile, settings, counter, bumpCounter, saveInvoices, saveClients]);

  const updateInvoice = useCallback(async (id, updates) => {
    const recalc = updates.items || updates.buyerState !== undefined;
    let extra = {};

    if (recalc) {
      const inv = invoices.find(i => i.id === id);
      const gstResult = computeInvoiceGst({
        sellerState: bizProfile.state,
        buyerState: updates.client?.state || updates.buyerState || inv?.client?.state,
        items: updates.items || inv?.items || [],
      });
      extra = {
        subtotal: gstResult.subtotal,
        totalDiscount: gstResult.totalDiscount,
        totalCgst: gstResult.totalCgst,
        totalSgst: gstResult.totalSgst,
        totalIgst: gstResult.totalIgst,
        totalGst: gstResult.totalGst,
        grandTotal: gstResult.grandTotal,
        isIntraState: gstResult.isIntraState,
        amountInWords: amountInWords(gstResult.grandTotal, bizProfile.currency || 'INR'),
        items: gstResult.processedItems,
      };
    }

    const updated = invoices.map(inv =>
      inv.id === id ? { ...inv, ...updates, ...extra, updatedAt: new Date().toISOString() } : inv
    );
    setInvoices(updated);
    await saveInvoices(updated);
    return updated.find(i => i.id === id);
  }, [invoices, bizProfile, saveInvoices]);

  const deleteInvoice = useCallback(async (id) => {
    const updated = invoices.filter(i => i.id !== id);
    setInvoices(updated);
    await saveInvoices(updated);
  }, [invoices, saveInvoices]);

  const duplicateInvoice = useCallback(async (id) => {
    const original = invoices.find(i => i.id === id);
    if (!original) return null;
    return createInvoice({
      ...original,
      invoiceNumber: null,
      series: original.series || 'INV',
      status: 'DRAFT',
      invoiceDate: new Date().toISOString().split('T')[0],
    });
  }, [invoices, createInvoice]);

  const recordPayment = useCallback(async (invoiceId, payment) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return null;
    const newPayment = {
      id: `pay_${Date.now()}`,
      amount: parseFloat(payment.amount) || 0,
      method: payment.method || 'Cash',
      date: payment.date || new Date().toISOString().split('T')[0],
      notes: payment.notes || '',
      recordedAt: new Date().toISOString(),
    };
    const payments = [...(inv.payments || []), newPayment];
    const paidAmount = payments.reduce((s, p) => s + p.amount, 0);
    const balanceDue = Math.max(0, inv.grandTotal - paidAmount);
    const status = balanceDue <= 0 ? 'PAID' : paidAmount > 0 ? 'PARTIALLY_PAID' : inv.status;

    return updateInvoice(invoiceId, { payments, paidAmount, balanceDue, status });
  }, [invoices, updateInvoice]);

  const markStatus = useCallback(async (id, status) => {
    return updateInvoice(id, { status });
  }, [updateInvoice]);

  // ── Client CRUD ─────────────────────────────────────────────────────────────
  const addClient = useCallback(async (data) => {
    const client = {
      id: `cli_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      ...data,
    };
    const updated = [client, ...clients];
    setClients(updated);
    await saveClients(updated);
    return client;
  }, [clients, saveClients]);

  const updateClient = useCallback(async (id, data) => {
    const updated = clients.map(c => c.id === id ? { ...c, ...data } : c);
    setClients(updated);
    await saveClients(updated);
  }, [clients, saveClients]);

  const deleteClient = useCallback(async (id) => {
    const updated = clients.filter(c => c.id !== id);
    setClients(updated);
    await saveClients(updated);
  }, [clients, saveClients]);

  const touchClient = useCallback(async (id) => {
    const updated = clients.map(c => c.id === id ? { ...c, lastUsed: new Date().toISOString() } : c);
    setClients(updated);
    await saveClients(updated);
  }, [clients, saveClients]);

  // ── Product CRUD ────────────────────────────────────────────────────────────
  const addProduct = useCallback(async (data) => {
    const product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      ...data,
    };
    const updated = [product, ...products];
    setProducts(updated);
    await saveProducts(updated);
    return product;
  }, [products, saveProducts]);

  const updateProduct = useCallback(async (id, data) => {
    const updated = products.map(p => p.id === id ? { ...p, ...data } : p);
    setProducts(updated);
    await saveProducts(updated);
  }, [products, saveProducts]);

  const deleteProduct = useCallback(async (id) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    await saveProducts(updated);
  }, [products, saveProducts]);

  const touchProduct = useCallback(async (id) => {
    const updated = products.map(p => p.id === id ? { ...p, lastUsed: new Date().toISOString() } : p);
    setProducts(updated);
    await saveProducts(updated);
  }, [products, saveProducts]);

  // ── Business Profile ────────────────────────────────────────────────────────
  const saveBusinessProfile = useCallback(async (data) => {
    const updated = { ...bizProfile, ...data };
    setBizProfile(updated);
    await saveBizProf(updated);
  }, [bizProfile, saveBizProf]);

  // ── Settings ────────────────────────────────────────────────────────────────
  const saveInvoiceSettings = useCallback(async (data) => {
    const updated = { ...settings, ...data };
    setSettings(updated);
    await saveSettings_(updated);
  }, [settings, saveSettings_]);

  // ── Derived analytics ───────────────────────────────────────────────────────
  const summaryStats = useMemo(() => {
    const now = new Date();
    let totalRevenue = 0, totalPending = 0, totalOverdue = 0, overdueCount = 0;
    invoices.forEach(inv => {
      if (inv.status === 'PAID') totalRevenue += inv.grandTotal;
      if (['PENDING', 'SENT', 'VIEWED', 'PARTIALLY_PAID'].includes(inv.status)) {
        totalPending += inv.balanceDue || inv.grandTotal;
        if (inv.dueDate && new Date(inv.dueDate) < now) {
          totalOverdue += inv.balanceDue || inv.grandTotal;
          overdueCount++;
        }
      }
    });
    return { totalRevenue, totalPending, totalOverdue, overdueCount, total: invoices.length };
  }, [invoices]);

  const isProfileComplete = useMemo(() =>
    !!(bizProfile.businessName && bizProfile.state && bizProfile.mobile),
  [bizProfile]);

  return (
    <InvoiceContext.Provider value={{
      // State
      invoices, clients, products, bizProfile, settings, loading,
      isProfileComplete, summaryStats,

      // Invoice actions
      createInvoice, updateInvoice, deleteInvoice, duplicateInvoice,
      recordPayment, markStatus, getNextInvoiceNumber,

      // Client actions
      addClient, updateClient, deleteClient, touchClient,

      // Product actions
      addProduct, updateProduct, deleteProduct, touchProduct,

      // Profile / settings
      saveBusinessProfile, saveInvoiceSettings,

      // Utilities
      computeGst: computeInvoiceGst, amountInWords,
      reload: loadAll,
    }}>
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoice() {
  const ctx = useContext(InvoiceContext);
  if (!ctx) throw new Error('useInvoice must be used within InvoiceProvider');
  return ctx;
}
