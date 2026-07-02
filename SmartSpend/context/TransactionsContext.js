// context/TransactionsContext.js
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "./AuthContext";

const TransactionsContext = createContext(null);
const STORAGE_KEY = "@smartspend_transactions_v1";

export function TransactionsProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [gstEnabled, setGstEnabled] = useState(true);
  const [roundUpEnabled, setRoundUpEnabled] = useState(false);
  const [privateMode, setPrivateMode] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState(null);
  const [savingsGoal, setSavingsGoal] = useState(null);
  const [useCustomCategories, setUseCustomCategories] = useState(false);
  const [customCategories, setCustomCategories] = useState({ in: [], out: [] });
  const [loading, setLoading] = useState(true);

  const refreshCategories = useCallback(async () => {
    try {
      if (user) {
        const res = await api.get('/categories');
        const all = res.data?.data || res.data || [];
        const custom = all.filter(c => c.isCustom || c.userId);
        setCustomCategories({
          in: custom.filter(c => c.type === 'income' || c.type === 'INCOME').map(c => ({ id: c.id, label: c.name, emoji: c.emoji || '💰', color: c.color || '#16A34A', bg: `${c.color || '#16A34A'}15`, type: c.type })),
          out: custom.filter(c => c.type === 'expense' || c.type === 'EXPENSE').map(c => ({ id: c.id, label: c.name, emoji: c.emoji || '🛒', color: c.color || '#DC2626', bg: `${c.color || '#DC2626'}15`, type: c.type })),
        });
      }
    } catch (e) {
      console.log("Failed to load categories", e);
    }
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        if (user) {
          // Fetch with higher limit to load recent transactions
          const res = await api.get('/transactions?limit=100&sortBy=date&sortOrder=desc');
          const payload = res.data?.data;
          // Handle both paginated {data: [], meta: {}} and plain array responses
          if (Array.isArray(payload)) {
            setTransactions(payload);
          } else if (payload?.data && Array.isArray(payload.data)) {
            setTransactions(payload.data);
          } else {
            setTransactions([]);
          }
        } else {
          setTransactions([]);
        }

        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          const parsed = JSON.parse(json);
          setGstEnabled(parsed.gstEnabled !== undefined ? !!parsed.gstEnabled : true);
          setRoundUpEnabled(!!parsed.roundUpEnabled);
          setPrivateMode(!!parsed.privateMode);
          setMonthlyBudget(
            typeof parsed.monthlyBudget === "number"
              ? parsed.monthlyBudget
              : null
          );
          setSavingsGoal(
            typeof parsed.savingsGoal === "number"
              ? parsed.savingsGoal
              : null
          );
          setUseCustomCategories(!!parsed.useCustomCategories);
        }
        await refreshCategories();
      } catch (e) {
        console.log("Failed to load transactions", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (loading) return;
    const persist = async () => {
      try {
        const payload = JSON.stringify({
          gstEnabled,
          roundUpEnabled,
          privateMode,
          monthlyBudget,
          savingsGoal,
          useCustomCategories,
        });
        await AsyncStorage.setItem(STORAGE_KEY, payload);
      } catch (e) {
        console.log("Failed to save transactions", e);
      }
    };
    persist();
  }, [
    gstEnabled,
    roundUpEnabled,
    privateMode,
    monthlyBudget,
    savingsGoal,
    useCustomCategories,
    loading,
  ]);

  const addTransaction = async (tx) => {
    try {
      const payload = {
        cashbookId: tx.bookId,
        type: tx.type === "in" ? "INCOME" : "EXPENSE",
        amount: tx.amount,
        currency: tx ? tx.currency || "INR" : "INR",
        date: tx.date,
        merchant: tx.category, // Map category name to merchant so auto-categorizer works
        notes: tx.note,
        paymentMethod: tx.paymentMethod,
        isGstApplied: tx.isGstApplied,
        gstRate: tx.gstRate,
        cgst: tx.cgst,
        sgst: tx.sgst,
        igst: tx.igst,
        labels: tx.isTaxDeductible ? ['TAX_DEDUCTIBLE'] : [],
      };

      // clean up undefined values
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === "") {
          delete payload[key];
        }
      });

      const res = await api.post('/transactions', payload);
      setTransactions((prev) => [res.data.data, ...prev]);
      return res.data.data;
    } catch(e) {
      console.log('Error adding tx:', e.response?.data || e.message);
      throw e;
    }
  };

  // FIXED: Changed api.put → api.patch to match backend PATCH /transactions/:id
  const updateTransaction = async (id, tx) => {
    try {
      const payload = {
        type: tx.type === "in" ? "INCOME" : (tx.type === "out" ? "EXPENSE" : tx.type),
        amount: tx.amount,
        currency: tx ? tx.currency || "INR" : "INR",
        date: tx.date,
        merchant: tx.category,
        notes: tx.note,
        paymentMethod: tx.paymentMethod,
        isGstApplied: tx.isGstApplied,
        gstRate: tx.gstRate,
        cgst: tx.cgst,
        sgst: tx.sgst,
        igst: tx.igst,
        labels: tx.isTaxDeductible ? ['TAX_DEDUCTIBLE'] : [],
      };

      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === "") {
          delete payload[key];
        }
      });

      const res = await api.patch(`/transactions/${id}`, payload);
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...res.data.data } : t)));
      return res.data.data;
    } catch(e) {
      console.log('Error updating tx:', e.response?.data || e.message);
      throw e;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      // Optimistic update for instant UI feedback
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      await api.delete(`/transactions/${id}`);
    } catch(e) {
      console.log('Error deleting tx', e);
      // Rollback on error by refreshing from server
      refreshTransactions();
      throw e;
    }
  };

  const refreshTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/transactions?limit=100&sortBy=date&sortOrder=desc');
      const payload = res.data?.data;
      if (Array.isArray(payload)) {
        setTransactions(payload);
      } else if (payload?.data && Array.isArray(payload.data)) {
        setTransactions(payload.data);
      }
    } catch (e) {
      console.log('Failed to refresh transactions', e);
    }
  }, [user]);

  const clearAllTransactions = () => {
    setTransactions([]);
  };

  const getBookBalance = (bookId) => {
    let inTotal = 0;
    let outTotal = 0;
    transactions.forEach((t) => {
      if (t.cashbookId !== bookId) return;
      if (t.type === "INCOME") inTotal += parseFloat(t.amount || 0);
      if (t.type === "EXPENSE") outTotal += parseFloat(t.amount || 0);
    });
    return {
      inTotal,
      outTotal,
      balance: inTotal - outTotal,
    };
  };

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        clearAllTransactions,
        refreshTransactions,
        getBookBalance,
        setTransactions,
        gstEnabled,
        setGstEnabled,
        roundUpEnabled,
        setRoundUpEnabled,
        privateMode,
        setPrivateMode,
        monthlyBudget,
        setMonthlyBudget,
        savingsGoal,
        setSavingsGoal,
        useCustomCategories,
        setUseCustomCategories,
        customCategories,
        refreshCategories,
        loading,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) {
    throw new Error(
      "useTransactions must be used within TransactionsProvider"
    );
  }
  return ctx;
}
