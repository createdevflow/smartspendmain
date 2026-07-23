// screens/WealthHubScreen.js
// Premium Cashtro Wealth Hub — INDmoney/Groww-style personal finance module

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAppTheme } from '../context/ThemeContext';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, TextInput, ActivityIndicator,
  Dimensions, Alert, Modal, Pressable,
  KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import OptimizedImage from '../components/OptimizedImage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useWealth } from '../context/WealthContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { TourStep, useTourGuide } from '../components/onboarding/TourGuide';
import { useOnboarding } from '../context/OnboardingContext';
import Svg, { Path, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { useIsFocused } from '@react-navigation/native';

const { width: W } = Dimensions.get('window');
const BRAND_NAVY = '#232333';
const BRAND_BLUE = '#2D8CFF';
const FONT_REGULAR = Platform.OS === 'ios' ? 'System' : 'Roboto';

let currentGlobalStyles = {};
const styles = new Proxy({}, {
  get(target, prop) {
    if (!currentGlobalStyles[prop] && typeof getStyles === 'function') {
      currentGlobalStyles = getStyles({ colors: {} }, false);
    }
    return currentGlobalStyles[prop];
  }
});

function useWealthStyles() {
  const { theme, isDark } = useAppTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  currentGlobalStyles = s;
  return s;
}

// ── Tab definitions ─────────────────────────────────────────────
const TABS = [
  { key: 'overview',  label: 'Overview',   icon: 'grid' },
  { key: 'gold',      label: 'Gold',       icon: 'award' },
  { key: 'crypto',    label: 'Crypto',     icon: 'cpu' },
  { key: 'stocks',    label: 'Stocks',     icon: 'bar-chart-2' },
  { key: 'forex',     label: 'Forex',      icon: 'globe' },
  { key: 'mf',        label: 'Funds',      icon: 'trending-up' },
  { key: 'watchlist', label: 'Watchlist',  icon: 'star' },
  { key: 'portfolio', label: 'Portfolio',  icon: 'pie-chart' },
  { key: 'news',      label: 'News',       icon: 'rss' },
  { key: 'insights',  label: 'AI',         icon: 'zap' },
  { key: 'calc',      label: 'Calculators',icon: 'sliders' },
];

// ── Sparkline Chart ─────────────────────────────────────────────
function SparkLine({ data = [], positive = true, width = 80, height = 34 }) {
  if (!data || data.length < 2) return <View style={{ width, height }} />;
  const vals = data.map((d) => (typeof d === 'object' ? d.v ?? d : d)).filter((v) => v !== null && !isNaN(v));
  if (vals.length < 2) return <View style={{ width, height }} />;
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const pts = vals.map((v, i) => ({
    x: (i / (vals.length - 1)) * width,
    y: height - ((v - min) / range) * height,
  }));
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const fillPath = `${d} L ${pts[pts.length - 1].x} ${height} L 0 ${height} Z`;
  const color = positive ? '#16A34A' : '#DC2626';
  const gradId = `spark_${positive ? 'pos' : 'neg'}_${Math.random().toString(36).slice(2, 6)}`;
  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgGrad id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.25" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </SvgGrad>
      </Defs>
      <Path d={fillPath} fill={`url(#${gradId})`} />
      <Path d={d} stroke={color} strokeWidth="1.8" fill="none" />
    </Svg>
  );
}

// ── Price Change Badge ──────────────────────────────────────────
function ChangeBadge({ value, size = 12 }) {
  if (value === null || value === undefined) return null;
  const isPos = value >= 0;
  return (
    <View style={[styles.badge, isPos ? styles.badgeGreen : styles.badgeRed]}>
      <Feather name={isPos ? 'arrow-up-right' : 'arrow-down-right'} size={size - 1} color={isPos ? '#16A34A' : '#DC2626'} />
      <Text style={[styles.badgeText, { color: isPos ? '#16A34A' : '#DC2626', fontSize: size }]}>
        {Math.abs(value).toFixed(2)}%
      </Text>
    </View>
  );
}

// ── Section Header ──────────────────────────────────────────────
function SectionHead({ title, subtitle }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
    </View>
  );
}

// ── Loading Skeleton ────────────────────────────────────────────
function Skeleton({ w = '100%', h = 16, radius = 8, style }) {
  return <View style={[{ width: w, height: h, borderRadius: radius, backgroundColor: '#E2E8F0', marginBottom: 8 }, style]} />;
}

// ── Search Box (shared, consistent) ────────────────────────────
function SearchBox({ value, onChangeText, placeholder, loading: isSearching }) {
  return (
    <View style={styles.searchBox}>
      <Feather name="search" size={16} color="#9CA3AF" />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {isSearching && <ActivityIndicator size="small" color={BRAND_BLUE} />}
    </View>
  );
}

const BottomSheet = React.forwardRef(({ title, children, snapPoints = ['50%', '90%'], onChange }, ref) => {
  const defaultSnapPoints = React.useMemo(() => snapPoints, [snapPoints]);
  const renderBackdrop = React.useCallback(
    (props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />,
    []
  );

  return (
    <BottomSheetModal
      ref={ref}
      index={defaultSnapPoints.length - 1}
      snapPoints={defaultSnapPoints}
      onChange={onChange}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      enableDynamicSizing={false}
      backgroundStyle={{ backgroundColor: '#fff', borderRadius: 24 }}
      handleIndicatorStyle={{ width: 40, backgroundColor: '#E2E8F0', marginTop: 10 }}
      keyboardBehavior="extend"
    >
      <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
        <Text style={styles.sheetTitle}>{title}</Text>
      </View>
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});
BottomSheet.displayName = 'BottomSheet';

// ═══════════════════════════════════════════════════════════════
// TAB SCREENS
// ═══════════════════════════════════════════════════════════════

// ── Overview Tab ────────────────────────────────────────────────
function OverviewTab() {
  const { metals, cryptos, indices, loading } = useWealth();
  const isLoading = loading.overview || loading.metals;

  return (
    <TourStep id="wealth_overview" style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Market Snapshot */}
        <SectionHead title="Market Snapshot" subtitle="Live prices" />
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} h={64} radius={14} style={{ marginHorizontal: 20, marginBottom: 10 }} />)
        ) : (
          <>
            {/* Indices row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 4 }}>
              {indices.map((idx) => (
                <View key={idx.symbol} style={styles.indexCard}>
                  <Text style={styles.indexName}>{idx.name}</Text>
                  <Text style={styles.indexPrice}>{idx.price?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                  <ChangeBadge value={idx.changePercent} />
                </View>
              ))}
            </ScrollView>

            {/* Metal summary */}
            {metals && (
              <View style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.flexRow}>
                    <Text style={styles.assetEmoji}>🏅</Text>
                    <View>
                      <Text style={styles.assetName}>Gold (24K)</Text>
                      <Text style={styles.assetSub}>per gram</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.assetPrice}>₹{metals.gold24k?.priceInrPerGram?.toFixed(2) ?? '—'}</Text>
                    <ChangeBadge value={metals.gold24k?.change24h} />
                  </View>
                </View>
              </View>
            )}

            {/* Top 3 cryptos */}
            {cryptos.slice(0, 3).map((coin) => (
              <View key={coin.id} style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.flexRow}>
                    <Text style={styles.assetEmoji}>{coin.symbol === 'btc' ? '₿' : coin.symbol === 'eth' ? '◎' : '●'}</Text>
                    <View>
                      <Text style={styles.assetName}>{coin.name}</Text>
                      <Text style={styles.assetSub}>{coin.symbol?.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.assetPrice}>${coin.current_price?.toLocaleString('en-US')}</Text>
                    <ChangeBadge value={coin.price_change_percentage_24h} />
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </TourStep>
  );
}

// ── Gold Tab ─────────────────────────────────────────────────────
function GoldTab() {
  const { metals, loading } = useWealth();

  const metalItems = metals ? [
    { label: '24K Gold',  key: 'gold24k',   emoji: '🥇', color: '#F59E0B' },
    { label: '22K Gold',  key: 'gold22k',   emoji: '🏅', color: '#D97706' },
    { label: 'Silver',    key: 'silver',    emoji: '🥈', color: '#6B7280' },
    { label: 'Platinum',  key: 'platinum',  emoji: '💎', color: '#2D8CFF' },
  ] : [];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      <SectionHead title="Gold & Metals" subtitle="Live rates in INR/gram" />

      {loading.metals ? (
        [1, 2, 3, 4].map(i => <Skeleton key={i} h={72} radius={14} style={{ marginHorizontal: 20, marginBottom: 10 }} />)
      ) : (
        metalItems.map(({ label, key, emoji, color }) => {
          const data = metals?.[key];
          return (
            <View key={key} style={[styles.card, styles.metalCard]}>
              <View style={[styles.metalIcon, { backgroundColor: `${color}18` }]}>
                <Text style={{ fontSize: 22 }}>{emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.metalLabel}>{label}</Text>
                <Text style={styles.metalPrice}>
                  {data ? `₹${data.priceInrPerGram?.toFixed(2)}` : '—'}
                </Text>
              </View>
              <ChangeBadge value={data?.change24h} />
            </View>
          );
        })
      )}

      <SectionHead title="Gold Calculator" subtitle="Estimate value of your gold" />
      <GoldCalculator metals={metals} />
    </ScrollView>
  );
}

function GoldCalculator({ metals }) {
  const [grams, setGrams] = useState('10');
  const [karat, setKarat] = useState('24');
  const price24k = metals?.gold24k?.priceInrPerGram ?? 0;
  const purity = parseFloat(karat) / 24;
  const value = parseFloat(grams || 0) * price24k * purity;

  return (
    <View style={[styles.card, { gap: 12 }]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>Weight (grams)</Text>
          <TextInput
            style={styles.calcInput}
            value={grams}
            onChangeText={setGrams}
            keyboardType="numeric"
            placeholder="10"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>Karat</Text>
          <View style={styles.karatRow}>
            {['24', '22', '18'].map((k) => (
              <TouchableOpacity
                key={k}
                style={[styles.karatBtn, karat === k && styles.karatBtnActive]}
                onPress={() => setKarat(k)}
              >
                <Text style={[styles.karatBtnText, karat === k && { color: '#fff' }]}>{k}K</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      <View style={styles.calcResult}>
        <Text style={styles.calcResultLabel}>Estimated Value</Text>
        <Text style={styles.calcResultValue}>₹{value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
        <Text style={styles.calcResultSub}>Based on live 24K rate @ ₹{price24k?.toFixed(2)}/g</Text>
      </View>
    </View>
  );
}

// ── Crypto Tab ────────────────────────────────────────────────────
function CryptoTab() {
  const { cryptos, loading } = useWealth();
  const [filter, setFilter] = useState('all');

  const sorted = [...cryptos].sort((a, b) => {
    if (filter === 'gainers') return b.price_change_percentage_24h - a.price_change_percentage_24h;
    if (filter === 'losers')  return a.price_change_percentage_24h - b.price_change_percentage_24h;
    return b.market_cap - a.market_cap;
  });

  return (
    <View style={{ flex: 1 }}>
      <SectionHead title="Crypto Markets" subtitle="Prices in USD" />

      <View style={styles.filterRow}>
        {[['all', 'All'], ['gainers', 'Top Gainers'], ['losers', 'Top Losers']].map(([k, l]) => (
          <TouchableOpacity key={k} style={[styles.filterChip, filter === k && styles.filterChipActive]} onPress={() => setFilter(k)}>
            <Text style={[styles.filterChipText, filter === k && { color: BRAND_BLUE, fontWeight: '700' }]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading.cryptos ? (
        <View style={{ padding: 20 }}>
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} h={64} radius={14} style={{ marginBottom: 10 }} />)}
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item, idx) => `${item.id}_${idx}`}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}
          renderItem={({ item }) => {
            const isPos = item.price_change_percentage_24h >= 0;
            const sparkData = item.sparkline_in_7d?.price ?? [];
            return (
              <View style={styles.cryptoRow}>
                <View style={[styles.cryptoRank, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={{ fontSize: 11, color: BRAND_NAVY, fontWeight: '700' }}>#{item.market_cap_rank}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.assetName}>{item.name}</Text>
                  <Text style={styles.assetSub}>{item.symbol?.toUpperCase()} · MC: ${(item.market_cap / 1e9).toFixed(1)}B</Text>
                </View>
                <SparkLine data={sparkData.slice(-20)} positive={isPos} width={60} height={28} />
                <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                  <Text style={styles.assetPrice}>${item.current_price?.toLocaleString('en-US', { maximumFractionDigits: item.current_price > 1 ? 2 : 6 })}</Text>
                  <ChangeBadge value={item.price_change_percentage_24h} />
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

// ── Stocks Tab ────────────────────────────────────────────────────
function StocksTab({ openStockDetails }) {
  const { indices, loading } = useWealth();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const searchStocks = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { api } = await import('../utils/api');
      const res = await api.get('/wealth/stocks/search', { params: { q } });
      setSearchResults(res.data?.data ?? res.data ?? []);
    } catch (_) { setSearchResults([]); }
    setSearching(false);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, backgroundColor: '#F7F9FC', zIndex: 10 }}>
        <SearchBox
          value={query}
          onChangeText={(t) => { setQuery(t); searchStocks(t); }}
          placeholder="Search stocks (e.g. RELIANCE, AAPL)"
          loading={searching}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
        {query.length > 0 ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            {searchResults.length === 0 && query.length > 1 && !searching && (
              <Text style={styles.noResults}>No results found for "{query}"</Text>
            )}
            {searchResults.map((s, idx) => (
              <TouchableOpacity
                key={`${s.symbol}_${idx}`}
                style={styles.searchResult}
                onPress={() => openStockDetails(s)}
                activeOpacity={0.7}
              >
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.assetName}>{s.symbol}</Text>
                    <Text style={styles.assetSub}>{s.name} · {s.exchange}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <>
            <SectionHead title="Indices" subtitle="Global market snapshot" />

            {loading.indices ? (
              <View style={{ paddingHorizontal: 20 }}>
                {[1, 2, 3].map(i => <Skeleton key={i} h={70} radius={14} style={{ marginBottom: 10 }} />)}
              </View>
            ) : (
              <View style={{ paddingHorizontal: 20 }}>
                {indices.map((idx) => (
                  <View key={idx.symbol} style={styles.indexRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.assetName}>{idx.name}</Text>
                      <Text style={styles.assetSub}>{idx.symbol}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.assetPrice}>{idx.price?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
                      <ChangeBadge value={idx.changePercent} />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── Forex Tab ─────────────────────────────────────────────────────
const CURRENCY_FLAGS = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', AED: '🇦🇪',
  SGD: '🇸🇬', JPY: '🇯🇵', AUD: '🇦🇺', CAD: '🇨🇦',
  CHF: '🇨🇭', CNY: '🇨🇳', INR: '🇮🇳',
};

function ForexTab() {
  const { forexRates, loading } = useWealth();
  const [amount, setAmount] = useState('1000');
  const [from, setFrom] = useState('INR');
  const [to, setTo] = useState('USD');

  const fromRate = forexRates.find((r) => r.code === from)?.rateToInr ?? 1;
  const toRate   = forexRates.find((r) => r.code === to)?.rateToInr ?? 1;
  const converted = from === 'INR'
    ? parseFloat(amount || 0) / toRate
    : parseFloat(amount || 0) * fromRate / toRate;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
      <SectionHead title="Forex Rates" subtitle="Live rates vs INR" />

      {/* Converter */}
      <View style={[styles.card, { gap: 12 }]}>
        <Text style={styles.sectionTitle}>Currency Converter</Text>
        <TextInput
          style={styles.calcInput}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="1000"
          placeholderTextColor="#9CA3AF"
        />
        <View style={styles.calcResult}>
          <Text style={styles.calcResultLabel}>{amount || '0'} {from} =</Text>
          <Text style={styles.calcResultValue}>
            {converted.toLocaleString('en-IN', { maximumFractionDigits: 4 })} {to}
          </Text>
        </View>
      </View>

      {loading.forex ? (
        <View style={{ paddingHorizontal: 20 }}>
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} h={60} radius={14} style={{ marginBottom: 10 }} />)}
        </View>
      ) : (
        <View style={{ paddingHorizontal: 20 }}>
          {forexRates.filter(r => r.rateToInr).map((rate) => (
            <View key={rate.code} style={styles.forexRow}>
              <Text style={styles.forexFlag}>{CURRENCY_FLAGS[rate.code] ?? '🌐'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.assetName}>{rate.code}</Text>
                <Text style={styles.assetSub}>{rate.name}</Text>
              </View>
              <Text style={styles.forexRate}>₹{rate.rateToInr?.toFixed(4)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ── Mutual Funds Tab ──────────────────────────────────────────────
function MFTab() {
  const { sipEntries, loading, addSIPEntry, deleteSIPEntry } = useWealth();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const sheetRef = useRef(null);
  const [selectedFund, setSelectedFund] = useState(null);
  const [monthly, setMonthly] = useState('');

  const searchFunds = useCallback(async (q) => {
    if (!q || q.length < 3) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { api } = await import('../utils/api');
      const res = await api.get('/wealth/mf/search', { params: { q } });
      setSearchResults((res.data?.data ?? res.data ?? []).slice(0, 15));
    } catch (_) { setSearchResults([]); }
    setSearching(false);
  }, []);

  const handleSelectFund = (fund) => {
    setSelectedFund(fund);
    setMonthly('');
    sheetRef.current?.present();
  };

  const handleAddSIP = () => {
    if (!selectedFund || !monthly) return;
    addSIPEntry({ 
      amfiCode: selectedFund.code, 
      fundName: selectedFund.name, 
      monthlyAmt: parseFloat(monthly),
      startDate: new Date().toISOString()
    });
    sheetRef.current?.dismiss();
    setSelectedFund(null);
    setMonthly('');
    setSearch('');
    setSearchResults([]);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, backgroundColor: '#F7F9FC', zIndex: 10 }}>
        <SearchBox
          value={search}
          onChangeText={(t) => { setSearch(t); searchFunds(t); }}
          placeholder="Search fund name (min 3 chars)…"
          loading={searching}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
        {search.length > 0 ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            {search.length >= 3 && searchResults.length === 0 && !searching && (
              <Text style={styles.noResults}>No funds found for "{search}"</Text>
            )}
            {searchResults.map((fund, idx) => (
              <TouchableOpacity
                key={`${fund.code}_${idx}`}
                style={styles.searchResult}
                onPress={() => handleSelectFund(fund)}
                activeOpacity={0.7}
              >
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.assetName} numberOfLines={1}>{fund.name}</Text>
                    <Text style={styles.assetSub}>NAV: ₹{fund.nav} · {fund.date}</Text>
                  </View>
                  <Feather name="plus-circle" size={18} color={BRAND_BLUE} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <>
            <SectionHead title="My SIP Entries" subtitle="Track your systematic investments" />
            {loading.sip ? (
              <View style={{ paddingHorizontal: 20 }}>
                {[1, 2].map(i => <Skeleton key={i} h={60} radius={14} style={{ marginBottom: 8 }} />)}
              </View>
            ) : sipEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📈</Text>
                <Text style={styles.emptyText}>No SIPs tracked yet. Search a fund above to add one.</Text>
              </View>
            ) : (
              sipEntries.map((sip) => (
                <View key={sip.id} style={styles.sipCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.assetName} numberOfLines={1}>{sip.fundName}</Text>
                    <Text style={styles.assetSub}>Monthly SIP: ₹{sip.monthlyAmt?.toLocaleString('en-IN')}</Text>
                  </View>
                  <TouchableOpacity onPress={() => Alert.alert('Delete SIP', `Remove "${sip.fundName}"?`, [
                    { text: 'Cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteSIPEntry(sip.id) },
                  ])}>
                    <Feather name="trash-2" size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Add SIP bottom sheet */}
      <BottomSheet 
        ref={sheetRef} 
        title="Add SIP Entry" 
        snapPoints={['65%']}
        onChange={(idx) => { if(idx === -1) setSelectedFund(null); }}
      >
        {selectedFund && (
          <View style={{ gap: 12 }}>
            <View style={{ backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12 }}>
              <Text style={styles.assetName} numberOfLines={2}>{selectedFund.name}</Text>
              <Text style={styles.assetSub}>Current NAV: ₹{selectedFund.nav}</Text>
            </View>
            <Text style={styles.inputLabel}>Monthly SIP Amount (₹)</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="e.g. 5000"
              placeholderTextColor="#9CA3AF"
              value={monthly}
              onChangeText={setMonthly}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.addBtn, !monthly.trim() && { opacity: 0.4 }]}
              disabled={!monthly.trim()}
              onPress={handleAddSIP}
            >
              <Text style={styles.addBtnText}>Add SIP Entry</Text>
            </TouchableOpacity>
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

// ── Watchlist Tab ─────────────────────────────────────────────────
function WatchlistTab() {
  const { watchlists, createWatchlist, deleteWatchlist } = useWealth();
  const sheetRef = useRef(null);
  const [newName, setNewName] = useState('');

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
      <SectionHead title="My Watchlists" subtitle="Track your favourite assets" />

      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <TouchableOpacity style={styles.addBtn} onPress={() => sheetRef.current?.present()}>
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.addBtnText}>New Watchlist</Text>
        </TouchableOpacity>
      </View>

      {watchlists.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>⭐</Text>
          <Text style={styles.emptyText}>No watchlists yet. Create one to track your favourite stocks, crypto, or gold.</Text>
        </View>
      ) : (
        watchlists.map((wl) => (
          <View key={wl.id} style={[styles.watchlistCard, { flexDirection: 'column', alignItems: 'stretch' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.watchlistDot, { backgroundColor: wl.color ?? BRAND_BLUE }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.assetName}>{wl.name}</Text>
                <Text style={styles.assetSub}>{wl.items?.length ?? 0} assets</Text>
              </View>
              <TouchableOpacity onPress={() => Alert.alert('Delete', `Delete "${wl.name}"?`, [
                { text: 'Cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteWatchlist(wl.id) },
              ])}>
                <Feather name="trash-2" size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
            {wl.items?.length > 0 && (
              <View style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderColor: '#F1F5F9', gap: 10 }}>
                {wl.items.map(item => (
                  <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={[styles.assetName, { fontSize: 14 }]}>{item.symbol}</Text>
                      <Text style={[styles.assetSub, { fontSize: 12 }]}>{item.displayName}</Text>
                    </View>
                    <Text style={[styles.assetSub, { fontSize: 12, fontWeight: '600' }]}>{item.assetType}</Text>
                  </View>
                ))}
              </View>
            )}
            {(!wl.items || wl.items.length === 0) && (
              <Text style={{ marginTop: 10, fontSize: 12, color: '#9CA3AF', fontFamily: FONT_REGULAR }}>
                0 assets. Search in Stocks or Crypto to add to this watchlist.
              </Text>
            )}
          </View>
        ))
      )}

      <BottomSheet ref={sheetRef} title="New Watchlist" snapPoints={['50%']}>
        <TextInput
          style={styles.sheetInput}
          placeholder="Watchlist name (e.g. Long Term)"
          placeholderTextColor="#9CA3AF"
          value={newName}
          onChangeText={setNewName}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (newName.trim()) {
              createWatchlist({ name: newName.trim() });
              sheetRef.current?.dismiss();
              setNewName('');
            }
          }}
        />
        <TouchableOpacity
          style={[styles.addBtn, !newName.trim() && { opacity: 0.4 }]}
          disabled={!newName.trim()}
          onPress={() => { createWatchlist({ name: newName.trim() }); sheetRef.current?.dismiss(); setNewName(''); }}
        >
          <Text style={styles.addBtnText}>Create Watchlist</Text>
        </TouchableOpacity>
      </BottomSheet>
    </ScrollView>
  );
}

// ── Portfolio Tab ─────────────────────────────────────────────────
function PortfolioTab() {
  const { portfolio, addHolding, deleteHolding, loading } = useWealth();
  const sheetRef = useRef(null);
  const [form, setForm] = useState({ assetType: 'CRYPTO', symbol: '', displayName: '', quantity: '', buyPrice: '' });

  const pnlIsPos = (portfolio?.pnl ?? 0) >= 0;

  const handleAddHolding = () => {
    addHolding(form);
    sheetRef.current?.dismiss();
    setForm({ assetType: 'STOCK', symbol: '', displayName: '', quantity: '', buyPrice: '' });
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
      <SectionHead title="My Portfolio" subtitle="Track all your investments" />

      {portfolio && (
        <View style={styles.portfolioSummary}>
          <View style={{ flex: 1 }}>
            <Text style={styles.portfolioLabel}>Total Value</Text>
            <Text style={styles.portfolioValue}>₹{portfolio.totalValue?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.portfolioLabel}>P&L</Text>
            <Text style={[styles.portfolioValue, { color: pnlIsPos ? '#4ADE80' : '#F87171', fontSize: 18 }]}>
              {pnlIsPos ? '+' : ''}₹{portfolio.pnl?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
            <ChangeBadge value={portfolio.pnlPercent} />
          </View>
        </View>
      )}

      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <TouchableOpacity style={styles.addBtn} onPress={() => sheetRef.current?.present()}>
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add Holding</Text>
        </TouchableOpacity>
      </View>

      {loading.portfolio ? (
        <View style={{ paddingHorizontal: 20 }}>
          {[1, 2, 3].map(i => <Skeleton key={i} h={72} radius={14} style={{ marginBottom: 10 }} />)}
        </View>
      ) : portfolio?.holdings?.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>💼</Text>
          <Text style={styles.emptyText}>No holdings yet. Add your first investment to track P&L.</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 20 }}>
          {portfolio?.holdings?.map((h) => {
            const pnlPos = h.pnl >= 0;
            return (
              <View key={h.id} style={styles.holdingCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.assetName}>{h.displayName}</Text>
                  <Text style={styles.assetSub}>{h.quantity} units @ ₹{h.buyPrice}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.assetPrice}>₹{h.currentValue?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                  <Text style={{ color: pnlPos ? '#16A34A' : '#DC2626', fontSize: 12, fontWeight: '600' }}>
                    {pnlPos ? '+' : ''}₹{h.pnl?.toFixed(0)} ({h.pnlPercent?.toFixed(1)}%)
                  </Text>
                </View>
                <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => deleteHolding(h.id)}>
                  <Feather name="trash-2" size={15} color="#DC2626" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      <BottomSheet ref={sheetRef} title="Add Holding" snapPoints={['60%']}>
        <ScrollView keyboardShouldPersistTaps="handled">
          {/* Asset type picker */}
          <Text style={[styles.inputLabel, { marginBottom: 8 }]}>Asset Type</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {['CRYPTO', 'STOCK', 'GOLD', 'MF'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.karatBtn, form.assetType === t && styles.karatBtnActive, { paddingHorizontal: 12 }]}
                onPress={() => setForm(f => ({ ...f, assetType: t }))}
              >
                <Text style={[styles.karatBtnText, form.assetType === t && { color: '#fff' }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {[['symbol', 'Symbol (e.g. BTC, RELIANCE.NS)', 'default'], ['displayName', 'Display Name (e.g. Bitcoin)', 'default'],
            ['quantity', 'Quantity', 'numeric'], ['buyPrice', 'Buy Price (₹)', 'numeric']].map(([k, ph, kbType]) => (
            <View key={k} style={{ marginBottom: 10 }}>
              <Text style={styles.inputLabel}>{ph.split(' (')[0]}</Text>
              <TextInput
                style={styles.sheetInput}
                placeholder={ph}
                placeholderTextColor="#9CA3AF"
                value={form[k]}
                onChangeText={(v) => setForm((f) => ({ ...f, [k]: v }))}
                keyboardType={kbType}
              />
            </View>
          ))}
          <TouchableOpacity style={styles.addBtn} onPress={handleAddHolding}>
            <Text style={styles.addBtnText}>Add Holding</Text>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheet>
    </ScrollView>
  );
}

// ── News Tab ──────────────────────────────────────────────────────
function NewsTab() {
  const { news, loading, fetchNews, saveArticle } = useWealth();
  const [category, setCategory] = useState('all');
  // Track if this is the very first load (show skeleton) vs a category switch (keep old data)
  const [hasLoaded, setHasLoaded] = useState(false);

  const CARD_W = (W - 52) / 2; // 2 cols, 20px side pad, 12px gap
  const CAT_COLORS = {
    all:     ['#232333', '#2D8CFF'],
    stocks:  ['#065F46', '#059669'],
    economy: ['#92400E', '#D97706'],
    crypto:  ['#7C2D12', '#F26D21'],
  };
  const CAT_EMOJI = { all: '📰', stocks: '📈', economy: '🏛️', crypto: '₿' };

  // Mark as loaded once data arrives
  React.useEffect(() => {
    if (news.length > 0) setHasLoaded(true);
  }, [news]);

  const handleCategoryPress = (k) => {
    setCategory(k);
    fetchNews(k);
  };

  const openArticle = async (item) => {
    const url = item.url ?? item.link;
    if (!url) { Alert.alert(item.title, item.summary ?? 'No content.'); return; }
    try {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: BRAND_NAVY,
        controlsColor: '#ffffff',
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.AUTOMATIC,
      });
    } catch (_) { Linking.openURL(url); }
  };

  // Only show skeleton on very first load; keep existing data while switching categories
  const showSkeleton = loading.news && !hasLoaded;

  return (
    <View style={{ flex: 1 }}>
      {/* Category pills */}
      <View style={styles.newsCatBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, gap: 8 }}
        >
          {[['all', 'All Markets'], ['stocks', 'Stocks'], ['economy', 'Economy'], ['crypto', 'Crypto']].map(([k, l]) => (
            <TouchableOpacity
              key={k}
              style={[styles.filterChip, category === k && styles.filterChipActive]}
              onPress={() => handleCategoryPress(k)}
            >
              {loading.news && category === k && hasLoaded && (
                <ActivityIndicator size="small" color={BRAND_BLUE} style={{ marginRight: 4 }} />
              )}
              <Text style={[styles.filterChipText, category === k && { color: BRAND_BLUE, fontWeight: '700' }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {showSkeleton ? (
        /* Skeleton only on true first load */
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12, paddingTop: 4 }}>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} w={CARD_W} h={190} radius={16} style={{ marginBottom: 0 }} />
          ))}
        </View>
      ) : news.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>📰</Text>
          <Text style={styles.emptyText}>No articles loaded. Select a category above.</Text>
        </View>
      ) : (
        <FlatList
          data={news}
          /* Always pure-index key — backend IDs from ET URLs were all identical */
          keyExtractor={(_, idx) => `news_${idx}`}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80, paddingTop: 4 }}
          renderItem={({ item }) => {
            const colors = CAT_COLORS[item.category] ?? CAT_COLORS.all;
            const emoji  = CAT_EMOJI[item.category]  ?? '📰';
            return (
              <TouchableOpacity
                style={[styles.newsGridCard, { width: CARD_W }]}
                onPress={() => openArticle(item)}
                activeOpacity={0.88}
              >
                {/* Image container */}
                <View style={{ width: CARD_W, height: 160, backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
                  {item.imageUrl ? (
                    <OptimizedImage
                      source={{ uri: item.imageUrl }}
                      style={{ width: '100%', height: '100%', position: 'absolute' }}
                      contentFit="cover"
                      size="medium"
                    />
                  ) : (
                    <View style={{ width: '100%', height: '100%', backgroundColor: colors[0], alignItems: 'center', justifyContent: 'center', position: 'absolute' }}>
                      <Text style={{ fontSize: 34 }}>{item.isCashtroBlog ? '✨' : emoji}</Text>
                    </View>
                  )}

                  {item.isCashtroBlog && (
                    <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: BRAND_BLUE, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, zIndex: 11, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3 }}>
                      <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>✨ CASHTRO EDITORIAL</Text>
                    </View>
                  )}

                  {/* Title overlaid at image bottom using standard View */}
                  <View
                    style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      paddingHorizontal: 10, paddingTop: 10, paddingBottom: 10,
                      zIndex: 10,
                    }}
                  >
                    <Text
                      style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700', lineHeight: 18 }}
                      numberOfLines={3}
                    >
                      {item.title || "No Title Available"}
                    </Text>
                  </View>

                  {/* Bookmark top-right */}
                  <TouchableOpacity
                    style={[styles.newsBookmark, { zIndex: 10 }]}
                    onPress={() => saveArticle(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="bookmark" size={13} color={BRAND_BLUE} />
                  </TouchableOpacity>
                </View>

                {/* Source + date */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 }}>
                    <Text style={{ fontSize: 10 }}>{item.isCashtroBlog ? '✨' : '📰'}</Text>
                    <Text style={[styles.newsSourceSmall, { flexShrink: 1, color: item.isCashtroBlog ? BRAND_BLUE : '#64748B', fontWeight: item.isCashtroBlog ? '700' : '500' }]} numberOfLines={1}>{item.source || 'News'}</Text>
                  </View>
                  {item.publishedAt && (
                    <Text style={styles.newsDateSmall}>
                      {new Date(item.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}


// ── AI Insights Tab ───────────────────────────────────────────────
function InsightsTab() {
  const { insights, loading } = useWealth();
  const TYPE_STYLES = {
    bullish: { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534' },
    bearish: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' },
    info:    { bg: '#EFF6FF', border: '#BFDBFE', text: '#232333' },
    risk:    { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
      <SectionHead title="AI Market Insights" subtitle="Rule-based analysis · Not financial advice" />

      {loading.insights ? (
        <View style={{ paddingHorizontal: 20 }}>
          {[1, 2, 3].map(i => <Skeleton key={i} h={80} radius={14} style={{ marginBottom: 12 }} />)}
        </View>
      ) : insights.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>💡</Text>
          <Text style={styles.emptyText}>No insights yet. Markets are being analysed...</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 20 }}>
          {insights.map((ins, i) => {
            const s = TYPE_STYLES[ins.type] ?? TYPE_STYLES.info;
            return (
              <View key={`insight_${i}`} style={[styles.insightCard, { backgroundColor: s.bg, borderColor: s.border }]}>
                <Text style={{ fontSize: 22, marginBottom: 6 }}>{ins.icon}</Text>
                <Text style={[styles.insightText, { color: s.text }]}>{ins.text}</Text>
                {ins.confidence && (
                  <View style={styles.confidenceRow}>
                    <Text style={[styles.confidenceText, { color: s.text }]}>Confidence: {ins.confidence}%</Text>
                  </View>
                )}
              </View>
            );
          })}
          <View style={styles.disclaimer}>
            <Feather name="alert-circle" size={13} color="#9CA3AF" />
            <Text style={styles.disclaimerText}>These insights are for informational purposes only and do not constitute financial advice.</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ── Calculators Tab ────────────────────────────────────────────────
function CalcTab() {
  const [active, setActive] = useState('sip');
  const [sipForm, setSipForm] = useState({ monthly: '5000', rate: '12', years: '10' });
  const [emiForm, setEmiForm] = useState({ principal: '500000', rate: '8.5', months: '60' });
  const [compForm, setCompForm] = useState({ principal: '100000', rate: '10', years: '5' });
  
  const [sipResult, setSipResult] = useState(null);
  const [emiResult, setEmiResult] = useState(null);
  const [compResult, setCompResult] = useState(null);

  useEffect(() => {
    const P = parseFloat(sipForm.monthly || 0);
    const R = parseFloat(sipForm.rate || 0);
    const Y = parseFloat(sipForm.years || 0);
    if (P > 0 && R >= 0 && Y > 0) {
      const i = R / 100 / 12;
      const n = Y * 12;
      const futureValue = i === 0 ? P * n : P * (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
      const invested = P * n;
      setSipResult({ futureValue: Math.round(futureValue), invested: Math.round(invested), returns: Math.round(futureValue - invested) });
    } else {
      setSipResult(null);
    }
  }, [sipForm]);

  useEffect(() => {
    const P = parseFloat(emiForm.principal || 0);
    const R = parseFloat(emiForm.rate || 0);
    const N = parseFloat(emiForm.months || 0);
    if (P > 0 && R >= 0 && N > 0) {
      const r = R / 100 / 12;
      const emi = r === 0 ? (P / N) : P * r * (Math.pow(1 + r, N) / (Math.pow(1 + r, N) - 1));
      const totalPayment = emi * N;
      setEmiResult({ emi: Math.round(emi), totalPayment: Math.round(totalPayment), interest: Math.round(totalPayment - P) });
    } else {
      setEmiResult(null);
    }
  }, [emiForm]);

  useEffect(() => {
    const P = parseFloat(compForm.principal || 0);
    const R = parseFloat(compForm.rate || 0);
    const Y = parseFloat(compForm.years || 0);
    if (P > 0 && R >= 0 && Y > 0) {
      const r = R / 100;
      const maturityAmount = P * Math.pow(1 + r, Y);
      setCompResult({ maturityAmount: Math.round(maturityAmount), invested: P, returns: Math.round(maturityAmount - P) });
    } else {
      setCompResult(null);
    }
  }, [compForm]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
      <SectionHead title="Financial Calculators" subtitle="Plan your financial future" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginBottom: 16 }}>
        {[['sip', 'SIP'], ['emi', 'EMI'], ['compound', 'Compound']].map(([k, l]) => (
          <TouchableOpacity key={k} style={[styles.filterChip, active === k && styles.filterChipActive]} onPress={() => setActive(k)}>
            <Text style={[styles.filterChipText, active === k && { color: BRAND_BLUE, fontWeight: '700' }]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {active === 'sip' && (
        <View style={[styles.card, { gap: 12 }]}>
          <Text style={styles.assetName}>SIP Calculator</Text>
          {[['monthly', 'Monthly SIP (₹)'], ['rate', 'Expected Return (% p.a.)'], ['years', 'Investment Period (years)']].map(([k, l]) => (
            <View key={k}>
              <Text style={styles.inputLabel}>{l}</Text>
              <TextInput style={styles.calcInput} value={sipForm[k]} onChangeText={(v) => setSipForm((f) => ({ ...f, [k]: v }))} keyboardType="numeric" placeholderTextColor="#9CA3AF" />
            </View>
          ))}
          {sipResult && (
            <View style={styles.calcResult}>
              <Text style={styles.calcResultLabel}>Maturity Value</Text>
              <Text style={styles.calcResultValue}>₹{sipResult.futureValue?.toLocaleString('en-IN')}</Text>
              <Text style={styles.calcResultSub}>Invested: ₹{sipResult.invested?.toLocaleString('en-IN')} · Returns: ₹{sipResult.returns?.toLocaleString('en-IN')}</Text>
            </View>
          )}
        </View>
      )}

      {active === 'emi' && (
        <View style={[styles.card, { gap: 12 }]}>
          <Text style={styles.assetName}>EMI Calculator</Text>
          {[['principal', 'Loan Amount (₹)'], ['rate', 'Interest Rate (% p.a.)'], ['months', 'Loan Tenure (months)']].map(([k, l]) => (
            <View key={k}>
              <Text style={styles.inputLabel}>{l}</Text>
              <TextInput style={styles.calcInput} value={emiForm[k]} onChangeText={(v) => setEmiForm((f) => ({ ...f, [k]: v }))} keyboardType="numeric" placeholderTextColor="#9CA3AF" />
            </View>
          ))}
          {emiResult && (
            <View style={styles.calcResult}>
              <Text style={styles.calcResultLabel}>Monthly EMI</Text>
              <Text style={styles.calcResultValue}>₹{emiResult.emi?.toLocaleString('en-IN')}</Text>
              <Text style={styles.calcResultSub}>Total: ₹{emiResult.totalPayment?.toLocaleString('en-IN')} · Interest: ₹{emiResult.interest?.toLocaleString('en-IN')}</Text>
            </View>
          )}
        </View>
      )}

      {active === 'compound' && (
        <View style={[styles.card, { gap: 12 }]}>
          <Text style={styles.assetName}>Compound Interest</Text>
          {[['principal', 'Principal Amount (₹)'], ['rate', 'Interest Rate (% p.a.)'], ['years', 'Time Period (years)']].map(([k, l]) => (
            <View key={k}>
              <Text style={styles.inputLabel}>{l}</Text>
              <TextInput style={styles.calcInput} value={compForm[k]} onChangeText={(v) => setCompForm((f) => ({ ...f, [k]: v }))} keyboardType="numeric" placeholderTextColor="#9CA3AF" />
            </View>
          ))}
          {compResult && (
            <View style={styles.calcResult}>
              <Text style={styles.calcResultLabel}>Maturity Amount</Text>
              <Text style={styles.calcResultValue}>₹{compResult.maturityAmount?.toLocaleString('en-IN')}</Text>
              <Text style={styles.calcResultSub}>Invested: ₹{compResult.invested?.toLocaleString('en-IN')} · Returns: ₹{compResult.returns?.toLocaleString('en-IN')}</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════
export default function WealthHubScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = useWealthStyles();

  const { hasAccess, getFeatureTease } = useFeatureAccess();
  const [activeTab, setActiveTab] = useState('overview');
  const { initWealth, stopPolling, watchlists, addToWatchlist } = useWealth();

  // Tour hooks
  const { startTour, activeTour, endTour } = useTourGuide();
  const isFocused = useIsFocused();
  const { shouldShowTour, markTourSeen } = useOnboarding();
  useEffect(() => {
    if (isFocused && shouldShowTour('wealth_tour')) {
      const t = setTimeout(() => { startTour('wealth_tour'); markTourSeen('wealth_tour'); }, 800);
      return () => clearTimeout(t);
    }
  }, [isFocused, shouldShowTour, startTour, markTourSeen]);

  useEffect(() => {
    if (!isFocused && activeTour === 'wealth_tour') endTour();
  }, [isFocused, activeTour, endTour]);

  if (!hasAccess('feature_wealth_hub') && getFeatureTease('feature_wealth_hub')) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
          <Feather name="award" size={36} color="#D97706" />
        </View>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#1E293B', marginBottom: 10, textAlign: 'center' }}>Pro Feature: Wealth Hub</Text>
        <Text style={{ fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 28, lineHeight: 22, paddingHorizontal: 12 }}>
          Track your live stock portfolio, mutual funds, gold prices, crypto market trends, and get AI-driven investment insights with Cashtro Pro!
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#2D8CFF', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 14, elevation: 3, shadowColor: '#2D8CFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
          onPress={() => Alert.alert('Upgrade to Pro', 'Unlock the complete Wealth Hub module by upgrading your account!')}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Upgrade to Pro</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const [selectedStock, setSelectedStock] = useState(null);
  const [stockDetails, setStockDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const stockSheetRef = useRef(null);

  const openStockDetails = async (stock) => {
    setSelectedStock(stock);
    setStockDetails(null);
    setLoadingDetails(true);
    stockSheetRef.current?.present();
    try {
      const { api } = await import('../utils/api');
      const res = await api.get(`/wealth/stocks/${stock.symbol}/quote`);
      setStockDetails(res.data?.data ?? res.data ?? null);
    } catch (_) {
      // Silently fail if quote unavailable
    }
    setLoadingDetails(false);
  };

  useEffect(() => {
    initWealth();
    return () => stopPolling();
  }, []);

  const TAB_COMPONENTS = {
    overview:  OverviewTab,
    gold:      GoldTab,
    crypto:    CryptoTab,
    stocks:    StocksTab,
    forex:     ForexTab,
    mf:        MFTab,
    watchlist: WatchlistTab,
    portfolio: PortfolioTab,
    news:      NewsTab,
    insights:  InsightsTab,
    calc:      CalcTab,
  };

  const ActiveTab = TAB_COMPONENTS[activeTab] ?? OverviewTab;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Premium header */}
      <LinearGradient colors={[BRAND_NAVY, BRAND_BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Wealth Hub</Text>
          <Text style={styles.headerSub}>Markets · Crypto · Gold · Funds</Text>
        </View>
        <View style={styles.headerLive}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </LinearGradient>

      {/* Tab bar */}
      <TourStep id="wealth_tabs">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.8}
          >
            <Feather name={tab.icon} size={13} color={activeTab === tab.key ? '#fff' : '#64748B'} />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      </TourStep>

      {/* Active tab content */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ActiveTab openStockDetails={openStockDetails} />
      </KeyboardAvoidingView>

      {/* GLOBAL STOCK DETAIL MODAL */}
      <BottomSheet 
        ref={stockSheetRef} 
        title={selectedStock?.name ?? 'Stock Details'}
        onChange={(idx) => { if(idx === -1) setSelectedStock(null); }}
      >
        {selectedStock && (
          <View style={{ gap: 12, paddingBottom: 20 }}>
            {loadingDetails ? (
              <View style={{ gap: 10 }}>
                <Skeleton h={30} w="40%" radius={8} />
                <Skeleton h={20} w="100%" radius={8} />
                <Skeleton h={20} w="100%" radius={8} />
                <Skeleton h={20} w="100%" radius={8} />
              </View>
            ) : stockDetails ? (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                  <Text style={{ fontSize: 32, fontWeight: '800', color: BRAND_NAVY, fontFamily: FONT_REGULAR }}>
                    {stockDetails.currency === 'INR' ? '₹' : '$'}
                    {stockDetails.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                  <ChangeBadge value={stockDetails.changePercent} size={14} />
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Symbol</Text>
                  <Text style={styles.detailValue}>{stockDetails.symbol}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Exchange</Text>
                  <Text style={styles.detailValue}>{stockDetails.exchange ?? selectedStock.exchange ?? '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Day High / Low</Text>
                  <Text style={styles.detailValue}>
                    {stockDetails.high?.toFixed(2) ?? '—'} / {stockDetails.low?.toFixed(2) ?? '—'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Prev Close / Open</Text>
                  <Text style={styles.detailValue}>
                    {stockDetails.prevClose?.toFixed(2) ?? '—'} / {stockDetails.open?.toFixed(2) ?? '—'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>P/E Ratio</Text>
                  <Text style={styles.detailValue}>{stockDetails.pe?.toFixed(2) ?? '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Volume</Text>
                  <Text style={styles.detailValue}>
                    {stockDetails.volume ? (stockDetails.volume / 1000000).toFixed(2) + 'M' : '—'}
                  </Text>
                </View>
              </>
            ) : (
              <View style={{ gap: 10 }}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Symbol</Text>
                  <Text style={styles.detailValue}>{selectedStock.symbol}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Exchange</Text>
                  <Text style={styles.detailValue}>{selectedStock.exchange ?? '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>{selectedStock.type ?? '—'}</Text>
                </View>
                <Text style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 10, fontFamily: FONT_REGULAR }}>Live quote unavailable</Text>
              </View>
            )}

            {!loadingDetails && (
              <View style={{ marginTop: 16 }}>
                <Text style={[styles.inputLabel, { marginBottom: 8 }]}>Add to Watchlist</Text>
                {watchlists?.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {watchlists.map(wl => (
                      <TouchableOpacity key={wl.id} style={[styles.filterChip, { borderColor: BRAND_BLUE, borderWidth: 1 }]} onPress={() => {
                        addToWatchlist(wl.id, { assetType: 'STOCK', symbol: selectedStock.symbol, displayName: selectedStock.name });
                        Alert.alert('Success', `Added ${selectedStock.symbol} to ${wl.name}`);
                        setSelectedStock(null);
                      }}>
                        <Text style={[styles.filterChipText, { color: BRAND_BLUE }]}>+ {wl.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={{ fontSize: 13, color: '#9CA3AF', fontFamily: FONT_REGULAR }}>
                    You haven't created any watchlists yet. Go to the Watchlist tab to create one.
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
function getStyles(theme, isDark) { return StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#F7F9FC' },
  header:     { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle:{ fontSize: 22, fontWeight: '800', color: isDark ? theme.colors.card : '#FFFFFF', letterSpacing: -0.5, fontFamily: FONT_REGULAR },
  headerSub:  { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2, fontFamily: FONT_REGULAR },
  headerLive: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5 },
  liveDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  liveText:   { fontSize: 11, fontWeight: '800', color: isDark ? theme.colors.card : '#FFFFFF', letterSpacing: 1, fontFamily: FONT_REGULAR },

  tabBar:     { backgroundColor: isDark ? theme.colors.card : '#FFFFFF', borderBottomWidth: 1, borderBottomColor: isDark ? theme.colors.border : '#F1F5F9', maxHeight: 54 },
  tabBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, backgroundColor: isDark ? theme.colors.border : '#F1F5F9' },
  tabBtnActive:{ backgroundColor: BRAND_BLUE },
  tabLabel:   { fontSize: 12, fontWeight: '600', color: isDark ? '#94A3B8' : '#64748B', fontFamily: FONT_REGULAR },
  tabLabelActive:{ color: isDark ? theme.colors.card : '#FFFFFF' },

  // Cards
  card:       { backgroundColor: isDark ? theme.colors.card : '#FFFFFF', borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 12, borderWidth: 1, borderColor: isDark ? theme.colors.border : '#EFF4FB' },
  metalCard:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  metalIcon:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metalLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 2, fontFamily: FONT_REGULAR },
  metalPrice: { fontSize: 18, fontWeight: '800', color: BRAND_NAVY, fontFamily: FONT_REGULAR },

  // Index card (horizontal scroll)
  indexCard:  { backgroundColor: isDark ? theme.colors.card : '#FFFFFF', borderRadius: 14, padding: 14, minWidth: 120, borderWidth: 1, borderColor: isDark ? theme.colors.border : '#EFF4FB', alignItems: 'center' },
  indexName:  { fontSize: 11, fontWeight: '700', color: isDark ? '#64748B' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, fontFamily: FONT_REGULAR },
  indexPrice: { fontSize: 16, fontWeight: '800', color: BRAND_NAVY, marginBottom: 4, fontFamily: FONT_REGULAR },
  indexRow:   { backgroundColor: isDark ? theme.colors.card : '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: isDark ? theme.colors.border : '#EFF4FB', flexDirection: 'row', alignItems: 'center' },

  // Asset rows
  row:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flexRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  assetEmoji: { fontSize: 26 },
  assetName:  { fontSize: 14, fontWeight: '700', color: isDark ? '#F8FAFC' : '#1E293B', marginBottom: 2, fontFamily: FONT_REGULAR },
  assetSub:   { fontSize: 11, color: '#94A3B8', fontWeight: '500', fontFamily: FONT_REGULAR },
  assetPrice: { fontSize: 14, fontWeight: '700', color: BRAND_NAVY, fontFamily: FONT_REGULAR },

  // Badge
  badge:      { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  badgeGreen: { backgroundColor: '#DCFCE7' },
  badgeRed:   { backgroundColor: '#FEE2E2' },
  badgeText:  { fontWeight: '700', fontFamily: FONT_REGULAR },

  // Crypto row
  cryptoRow:  { backgroundColor: isDark ? theme.colors.card : '#FFFFFF', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: isDark ? theme.colors.border : '#EFF4FB', flexDirection: 'row', alignItems: 'center', gap: 8 },
  cryptoRank: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  // Forex
  forexRow:   { backgroundColor: isDark ? theme.colors.card : '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: isDark ? theme.colors.border : '#EFF4FB', flexDirection: 'row', alignItems: 'center', gap: 12 },
  forexFlag:  { fontSize: 24 },
  forexRate:  { fontSize: 15, fontWeight: '700', color: BRAND_NAVY, fontFamily: FONT_REGULAR },

  // Section header
  sectionHead:{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  sectionTitle:{ fontSize: 16, fontWeight: '800', color: isDark ? '#F8FAFC' : '#1E293B', fontFamily: FONT_REGULAR },
  sectionSub: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontFamily: FONT_REGULAR },

  // Filter chips
  filterRow:  { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 8, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: isDark ? theme.colors.border : '#F1F5F9' },
  filterChipActive: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: BRAND_BLUE },
  filterChipText: { fontSize: 12, fontWeight: '500', color: isDark ? '#94A3B8' : '#64748B', fontFamily: FONT_REGULAR },

  // Search — unified consistent styling
  searchBox:  {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? theme.colors.card : '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: isDark ? theme.colors.border : '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput:{ flex: 1, fontSize: 14, color: isDark ? '#F8FAFC' : '#1E293B', fontFamily: FONT_REGULAR, fontWeight: '500', padding: 0, margin: 0 },
  searchResult:{ backgroundColor: isDark ? theme.colors.card : '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 6, borderWidth: 1, borderColor: isDark ? theme.colors.border : '#EFF4FB' },
  noResults:  { fontSize: 13, color: '#94A3B8', textAlign: 'center', paddingVertical: 16, fontFamily: FONT_REGULAR },
  // News — 2-column grid
  newsCatBar:    { borderBottomWidth: 1, borderBottomColor: isDark ? theme.colors.border : '#F1F5F9' },
  newsGridCard: {
    backgroundColor: isDark ? theme.colors.card : '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? theme.colors.border : '#EFF4FB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  newsThumb:     { height: 110, width: '100%' },
  // No flex:1 or justifyContent here — natural height, prevents white gap
  newsGridBody:  { padding: 10, paddingTop: 8 },
  newsGridTitle: { fontSize: 12, fontWeight: '700', color: isDark ? '#F8FAFC' : '#1E293B', lineHeight: 17, marginBottom: 6, fontFamily: FONT_REGULAR },
  newsGridMeta:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 },
  newsSourceSmall: { fontSize: 9, color: BRAND_BLUE, fontWeight: '700', fontFamily: FONT_REGULAR, flexShrink: 1 },
  newsDateSmall:   { fontSize: 9, color: isDark ? '#64748B' : '#9CA3AF', fontFamily: FONT_REGULAR },
  newsBookmark:  { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  // Legacy (kept for other usages)
  newsCard:     { backgroundColor: isDark ? theme.colors.card : '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: isDark ? theme.colors.border : '#EFF4FB', flexDirection: 'row', alignItems: 'flex-start', gap: 2 },
  newsTitle:    { fontSize: 14, fontWeight: '700', color: isDark ? '#F8FAFC' : '#1E293B', lineHeight: 20, marginBottom: 4, fontFamily: FONT_REGULAR },
  newsSub:      { fontSize: 12, color: isDark ? '#94A3B8' : '#64748B', lineHeight: 17, marginBottom: 6, fontFamily: FONT_REGULAR },
  newsMeta:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  newsSource:   { fontSize: 10, color: BRAND_BLUE, fontWeight: '600', fontFamily: FONT_REGULAR },
  newsDate:     { fontSize: 10, color: isDark ? '#64748B' : '#9CA3AF', fontFamily: FONT_REGULAR },

  // Detail rows (for stock modal etc.)
  detailRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: isDark ? theme.colors.border : '#F1F5F9' },
  detailLabel:{ fontSize: 13, color: isDark ? '#94A3B8' : '#64748B', fontFamily: FONT_REGULAR },
  detailValue:{ fontSize: 13, fontWeight: '700', color: isDark ? '#F8FAFC' : '#1E293B', fontFamily: FONT_REGULAR },

  // Calculator
  inputLabel: { fontSize: 11, fontWeight: '700', color: isDark ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, fontFamily: FONT_REGULAR },
  calcInput:  { backgroundColor: isDark ? theme.colors.background : '#F8FAFC', borderRadius: 12, borderWidth: 1.5, borderColor: isDark ? theme.colors.border : '#E2E8F0', padding: 12, fontSize: 16, color: isDark ? '#F8FAFC' : '#1E293B', fontWeight: '600', fontFamily: FONT_REGULAR },
  karatRow:   { flexDirection: 'row', gap: 8 },
  karatBtn:   { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: isDark ? theme.colors.border : '#F1F5F9', alignItems: 'center' },
  karatBtnActive: { backgroundColor: BRAND_BLUE },
  karatBtnText: { fontSize: 13, fontWeight: '700', color: isDark ? '#94A3B8' : '#64748B', fontFamily: FONT_REGULAR },
  calcResult: { backgroundColor: '#EFF6FF', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  calcResultLabel: { fontSize: 11, fontWeight: '700', color: '#2D8CFF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontFamily: FONT_REGULAR },
  calcResultValue: { fontSize: 28, fontWeight: '800', color: BRAND_NAVY, marginBottom: 4, fontFamily: FONT_REGULAR },
  calcResultSub: { fontSize: 11, color: isDark ? '#94A3B8' : '#64748B', textAlign: 'center', fontFamily: FONT_REGULAR },

  // Portfolio
  portfolioSummary: { backgroundColor: BRAND_NAVY, borderRadius: 16, margin: 20, padding: 20, flexDirection: 'row' },
  portfolioLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4, fontFamily: FONT_REGULAR },
  portfolioValue: { fontSize: 22, fontWeight: '800', color: isDark ? theme.colors.card : '#FFFFFF', fontFamily: FONT_REGULAR },
  holdingCard: { backgroundColor: isDark ? theme.colors.card : '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: isDark ? theme.colors.border : '#EFF4FB', flexDirection: 'row', alignItems: 'center', gap: 8 },

  // Watchlist
  watchlistCard: { backgroundColor: isDark ? theme.colors.card : '#FFFFFF', borderRadius: 14, padding: 14, marginHorizontal: 20, marginBottom: 8, borderWidth: 1, borderColor: isDark ? theme.colors.border : '#EFF4FB', flexDirection: 'row', alignItems: 'center', gap: 12 },
  watchlistDot: { width: 12, height: 12, borderRadius: 6 },

  // SIP
  sipCard:    { backgroundColor: isDark ? theme.colors.card : '#FFFFFF', borderRadius: 14, padding: 14, marginHorizontal: 20, marginBottom: 8, borderWidth: 1, borderColor: isDark ? theme.colors.border : '#EFF4FB', flexDirection: 'row', alignItems: 'center', gap: 8 },

  // Insights
  insightCard:{ borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  insightText:{ fontSize: 14, lineHeight: 22, fontWeight: '500', fontFamily: FONT_REGULAR },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  confidenceText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: FONT_REGULAR },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, padding: 14, backgroundColor: isDark ? theme.colors.background : '#F8FAFC', borderRadius: 12, marginTop: 8 },
  disclaimerText: { flex: 1, fontSize: 11, color: isDark ? '#64748B' : '#9CA3AF', lineHeight: 16, fontFamily: FONT_REGULAR },

  // Add button
  addBtn:     { backgroundColor: BRAND_BLUE, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addBtnText: { color: isDark ? theme.colors.card : '#FFFFFF', fontWeight: '700', fontSize: 15, fontFamily: FONT_REGULAR },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 40 },
  emptyText:  { fontSize: 14, color: isDark ? '#64748B' : '#9CA3AF', textAlign: 'center', lineHeight: 22, fontFamily: FONT_REGULAR },

  // Modal / bottom sheet
  backdrop:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  bottomSheet:{
    backgroundColor: isDark ? theme.colors.card : '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    gap: 14,
    maxHeight: '85%',
  },
  sheetHandle:{ width: 40, height: 4, borderRadius: 2, backgroundColor: isDark ? theme.colors.border : '#E2E8F0', alignSelf: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: isDark ? '#F8FAFC' : '#1E293B', fontFamily: FONT_REGULAR },
  sheetInput: {
    backgroundColor: isDark ? theme.colors.background : '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: isDark ? theme.colors.border : '#E2E8F0',
    padding: 14,
    fontSize: 15,
    color: isDark ? '#F8FAFC' : '#1E293B',
    fontFamily: FONT_REGULAR,
  },
});
}
