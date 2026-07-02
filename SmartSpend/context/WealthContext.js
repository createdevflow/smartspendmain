// context/WealthContext.js
// Centralized state + data fetching for the Wealth Hub module

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { api } from '../utils/api';

const WealthContext = createContext(null);

const POLL_INTERVAL = 60000; // 60 seconds

export function WealthProvider({ children }) {
  const [overview,    setOverview]    = useState(null);
  const [metals,      setMetals]      = useState(null);
  const [cryptos,     setCryptos]     = useState([]);
  const [indices,     setIndices]     = useState([]);
  const [forexRates,  setForexRates]  = useState([]);
  const [news,        setNews]        = useState([]);
  const [insights,    setInsights]    = useState([]);
  const [watchlists,  setWatchlists]  = useState([]);
  const [portfolio,   setPortfolio]   = useState(null);
  const [alerts,      setAlerts]      = useState([]);
  const [sipEntries,  setSipEntries]  = useState([]);
  const [loading,     setLoading]     = useState({});
  const [errors,      setErrors]      = useState({});
  const pollRef = useRef(null);

  // ── Generic fetch helper ──────────────────────────────────────
  const fetch = useCallback(async (key, endpoint, setter, params = {}) => {
    setLoading((l) => ({ ...l, [key]: true }));
    setErrors((e) => ({ ...e, [key]: null }));
    try {
      const res = await api.get(endpoint, { params });
      setter(res.data?.data ?? res.data);
    } catch (err) {
      setErrors((e) => ({ ...e, [key]: err?.response?.data?.message ?? 'Failed to load' }));
    } finally {
      setLoading((l) => ({ ...l, [key]: false }));
    }
  }, []);

  // ── Fetch functions ───────────────────────────────────────────
  const fetchOverview   = useCallback(() => fetch('overview',  '/wealth/overview', setOverview), [fetch]);
  const fetchMetals     = useCallback(() => fetch('metals',    '/wealth/gold/rates', setMetals), [fetch]);
  const fetchCryptos    = useCallback(() => fetch('cryptos',   '/wealth/crypto/markets', setCryptos), [fetch]);
  const fetchIndices    = useCallback(() => fetch('indices',   '/wealth/stocks/indices', setIndices), [fetch]);
  const fetchForex      = useCallback(() => fetch('forex',     '/wealth/forex/rates', setForexRates), [fetch]);
  const fetchNews       = useCallback((cat = 'all') => fetch('news', '/wealth/news', setNews, { category: cat }), [fetch]);
  const fetchInsights   = useCallback(() => fetch('insights',  '/wealth/insights', setInsights), [fetch]);
  const fetchWatchlists = useCallback(() => fetch('watchlists','/wealth/watchlists', setWatchlists), [fetch]);
  const fetchPortfolio  = useCallback(() => fetch('portfolio', '/wealth/portfolio/summary', setPortfolio), [fetch]);
  const fetchAlerts     = useCallback(() => fetch('alerts',    '/wealth/alerts', setAlerts), [fetch]);
  const fetchSIP        = useCallback(() => fetch('sip',       '/wealth/sip', setSipEntries), [fetch]);

  // ── Initial & polling fetch ────────────────────────────────────
  const initWealth = useCallback(() => {
    fetchOverview();
    fetchMetals();
    fetchCryptos();
    fetchIndices();
    fetchForex();
    fetchNews();
    fetchInsights();
    fetchWatchlists();
    fetchPortfolio();
    fetchAlerts();
    fetchSIP();

    // Start polling for live prices
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      fetchMetals();
      fetchCryptos();
      fetchIndices();
      fetchForex();
    }, POLL_INTERVAL);
  }, [fetchOverview, fetchMetals, fetchCryptos, fetchIndices, fetchForex, fetchNews, fetchInsights, fetchWatchlists, fetchPortfolio, fetchAlerts, fetchSIP]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  // ── Watchlist mutations ───────────────────────────────────────
  const createWatchlist = async (data) => {
    const res = await api.post('/wealth/watchlists', data);
    await fetchWatchlists();
    return res.data;
  };
  const deleteWatchlist = async (id) => {
    await api.delete(`/wealth/watchlists/${id}`);
    await fetchWatchlists();
  };
  const addToWatchlist = async (watchlistId, item) => {
    await api.post(`/wealth/watchlists/${watchlistId}/items`, item);
    await fetchWatchlists();
  };
  const removeFromWatchlist = async (watchlistId, itemId) => {
    await api.delete(`/wealth/watchlists/${watchlistId}/items/${itemId}`);
    await fetchWatchlists();
  };

  // ── Portfolio mutations ───────────────────────────────────────
  const addHolding = async (data) => {
    await api.post('/wealth/portfolio', data);
    await fetchPortfolio();
  };
  const deleteHolding = async (id) => {
    await api.delete(`/wealth/portfolio/${id}`);
    await fetchPortfolio();
  };

  // ── Alert mutations ───────────────────────────────────────────
  const createAlert = async (data) => {
    await api.post('/wealth/alerts', data);
    await fetchAlerts();
  };
  const deleteAlert = async (id) => {
    await api.delete(`/wealth/alerts/${id}`);
    await fetchAlerts();
  };

  // ── News mutations ────────────────────────────────────────────
  const saveArticle = async (article) => {
    await api.post('/wealth/news/save', article);
  };

  // ── SIP mutations ─────────────────────────────────────────────
  const addSIPEntry = async (data) => {
    await api.post('/wealth/sip', data);
    await fetchSIP();
  };
  const deleteSIPEntry = async (id) => {
    await api.delete(`/wealth/sip/${id}`);
    await fetchSIP();
  };

  // ── Calculators (call backend) ────────────────────────────────
  const calcSIP = async (monthly, rate, years) => {
    const res = await api.get('/wealth/calculators/sip', { params: { monthly, rate, years } });
    return res.data?.data ?? res.data;
  };
  const calcEMI = async (principal, rate, months) => {
    const res = await api.get('/wealth/calculators/emi', { params: { principal, rate, months } });
    return res.data?.data ?? res.data;
  };
  const calcCompound = async (principal, rate, years, frequency = 12) => {
    const res = await api.get('/wealth/calculators/compound', { params: { principal, rate, years, frequency } });
    return res.data?.data ?? res.data;
  };

  return (
    <WealthContext.Provider value={{
      // State
      overview, metals, cryptos, indices, forexRates, news, insights,
      watchlists, portfolio, alerts, sipEntries, loading, errors,
      // Fetch
      initWealth, stopPolling, fetchOverview, fetchMetals, fetchCryptos,
      fetchIndices, fetchForex, fetchNews, fetchInsights,
      fetchWatchlists, fetchPortfolio, fetchAlerts, fetchSIP,
      // Mutations
      createWatchlist, deleteWatchlist, addToWatchlist, removeFromWatchlist,
      addHolding, deleteHolding, createAlert, deleteAlert, saveArticle,
      addSIPEntry, deleteSIPEntry,
      // Calculators
      calcSIP, calcEMI, calcCompound,
    }}>
      {children}
    </WealthContext.Provider>
  );
}

export const useWealth = () => {
  const ctx = useContext(WealthContext);
  if (!ctx) throw new Error('useWealth must be inside WealthProvider');
  return ctx;
};
