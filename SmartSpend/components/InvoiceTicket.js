import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';

const BRAND_NAVY = '#1E3A8A';
const BRAND_BLUE = '#2563EB';

// ── 2-column info cell ─────────────────────────────────────────────────────
const InfoCell = ({ icon, label, value }) => {
  if (!value) return <View style={styles.infoCell} />;
  return (
    <View style={styles.infoCell}>
      <View style={styles.infoCellHeader}>
        <Feather name={icon} size={11} color={BRAND_BLUE} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  );
};

const InvoiceTicket = forwardRef(({ transaction, currencySymbol = '₹' }, ref) => {
  if (!transaction) return null;

  const { amount, category, type, date, paymentMethod, note, notes, id, isGstApplied, merchant } = transaction;
  const finalNote = (note || notes || '').trim();
  const isIncome = type === 'in' || type === 'INCOME';

  const formattedDate = new Date(date || new Date()).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const refId     = id ? id.slice(-8).toUpperCase() : 'N/A';
  const catName   = category?.name || merchant || 'General';
  const amtFmt    = parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  return (
    <ViewShot ref={ref} options={{ format: 'png', quality: 1.0 }} style={styles.container}>
      <View style={styles.ticket}>

        {/* ── Header ── */}
        <LinearGradient
          colors={[BRAND_NAVY, BRAND_BLUE]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.brandRow}>
            <Image source={require('../assets/images/cashtro-logo.png')} style={{ width: 140, height: 42, resizeMode: 'contain' }} />
            <View style={styles.receiptBadge}>
              <Feather name="check-circle" size={10} color="#BFDBFE" />
              <Text style={styles.receiptBadgeText}>RECEIPT</Text>
            </View>
          </View>
          <Text style={styles.txLabel}>TRANSACTION RECORD</Text>
          <Text style={styles.txId}>TXN-{refId}</Text>
        </LinearGradient>

        {/* ── Amount Section ── */}
        <View style={styles.amountSection}>
          <View style={[styles.dirIcon, isIncome ? styles.dirIn : styles.dirOut]}>
            <Feather
              name={isIncome ? 'arrow-down-left' : 'arrow-up-right'}
              size={18}
              color={isIncome ? '#16A34A' : '#DC2626'}
            />
          </View>
          <Text style={styles.amountLabel}>
            {isIncome ? 'Amount Received' : 'Amount Paid'}
          </Text>
          <Text style={[styles.amountValue, isIncome ? styles.colorIn : styles.colorOut]}>
            {isIncome ? '+' : '−'}{currencySymbol}{amtFmt}
          </Text>
        </View>

        {/* ── Tear line ── */}
        <View style={styles.tearWrap}>
          <View style={styles.tearLeft} />
          <View style={styles.tearDashes}>
            {[...Array(24)].map((_, i) => <View key={i} style={styles.dash} />)}
          </View>
          <View style={styles.tearRight} />
        </View>

        {/* ── Details — 2-column grid ── */}
        <View style={styles.detailsSection}>
          <View style={styles.infoGrid}>
            <InfoCell icon="calendar" label="Date & Time"      value={formattedDate} />
            <InfoCell icon="tag"      label="Category"         value={catName} />
            <InfoCell icon="credit-card" label="Payment"       value={paymentMethod || 'Wallet'} />
            <InfoCell icon="hash"     label="Reference ID"     value={`TXN-${refId}`} />
          </View>

          {/* GST pill — full width if present */}
          {isGstApplied && (
            <View style={styles.gstPill}>
              <Feather name="percent" size={10} color={BRAND_BLUE} />
              <Text style={styles.gstText}>GST Applied</Text>
            </View>
          )}

          {/* Remark — only show if user entered one */}
          {!!finalNote && (
            <View style={styles.remarkBox}>
              <Text style={styles.remarkLabel}>Remark</Text>
              <Text style={styles.remarkValue}>{finalNote}</Text>
            </View>
          )}
        </View>

        {/* ── Minimal footer — just brand text, no logo image ── */}
        <View style={styles.footer}>
          <Feather name="zap" size={11} color={BRAND_BLUE} />
          <Text style={styles.footerText}>Cashtro · cashtro.in</Text>
        </View>

      </View>
    </ViewShot>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EFF4FB',
    padding: 20,
    alignItems: 'center',
  },
  ticket: {
    backgroundColor: '#ffffff',
    width: 320,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },

  /* Header */
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 5,
  },
  logoText: {
    color: BRAND_NAVY,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  receiptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  receiptBadgeText: {
    color: '#BFDBFE',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  txLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 3,
  },
  txId: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  /* Amount */
  amountSection: {
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  dirIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dirIn:  { backgroundColor: '#DCFCE7' },
  dirOut: { backgroundColor: '#FEE2E2' },
  amountLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  colorIn:  { color: '#16A34A' },
  colorOut: { color: BRAND_NAVY },

  /* Tear line */
  tearWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 1,
  },
  tearLeft: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#EFF4FB', marginLeft: -8,
  },
  tearRight: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#EFF4FB', marginRight: -8,
  },
  tearDashes: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    overflow: 'hidden',
  },
  dash: {
    width: 5, height: 1.5,
    backgroundColor: '#DBEAFE',
    borderRadius: 1,
  },

  /* Details - 2 column grid */
  detailsSection: {
    padding: 18,
    backgroundColor: '#ffffff',
    gap: 0,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
    marginBottom: 2,
  },
  infoCell: {
    width: '50%',
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  infoCellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  infoLabel: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  infoValue: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '600',
    paddingLeft: 16, // align under label (icon width + gap)
  },

  /* GST */
  gstPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 8,
    marginBottom: 10,
  },
  gstText: {
    color: BRAND_BLUE,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* Remark */
  remarkBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 3,
    borderLeftColor: BRAND_BLUE,
    marginTop: 8,
  },
  remarkLabel: {
    color: BRAND_BLUE,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 3,
  },
  remarkValue: {
    color: '#374151',
    fontSize: 12,
    lineHeight: 17,
  },

  /* Minimal footer */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default InvoiceTicket;
