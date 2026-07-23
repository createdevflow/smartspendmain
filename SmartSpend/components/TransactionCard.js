// components/TransactionCard.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "../theme/colors";
import { formatDate, formatTime } from "../utils/dateUtils";
import { maskCurrency } from "../context/TransactionsContext";
import { useAppTheme } from "../context/ThemeContext";

export default function TransactionCard({
  tx,
  privateMode,
  onDelete,
}) {
  const { isDark } = useAppTheme();
  const isIn = tx.type === "in";
  const amountText = privateMode ? maskCurrency(tx.amount, '₹', isIn ? '+' : '−') : `₹${tx.amount.toFixed(2)}`;
  const hasGst = tx.isGstApplied && tx.gstRate > 0;
  const gstTotal = (tx.cgst || 0) + (tx.sgst || 0) + (tx.igst || 0);

  return (
    <View style={[styles.card, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }]}>
      <View style={styles.headerRow}>
        <View style={styles.iconRow}>
          <View
            style={[
              styles.icon,
              { backgroundColor: isIn ? colors.success : colors.warning },
            ]}
          >
            <Feather
              name={isIn ? "arrow-down-left" : "arrow-up-right"}
              size={18}
              color="#FFFFFF"
            />
          </View>

          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.category, isDark && { color: '#F8FAFC' }]} numberOfLines={1}>
                {tx.category || (isIn ? "Cash-in" : "Cash-out")}
              </Text>
              {(tx.receiptUrl || tx.receiptKey) && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(tx.receiptUrl || tx.receiptKey)}
                >
                  {String(tx.receiptUrl || tx.receiptKey).toLowerCase().endsWith('.pdf') ? (
                    <View style={{ backgroundColor: isDark ? 'rgba(45,140,255,0.2)' : '#EFF6FF', borderRadius: 4, padding: 4 }}>
                      <Feather name="file-text" size={14} color={colors.primary} />
                    </View>
                  ) : (
                    <Image 
                      source={{ uri: tx.receiptUrl || tx.receiptKey }} 
                      style={{ width: 24, height: 24, borderRadius: 4, borderWidth: 1, borderColor: isDark ? '#334155' : '#E5E7EB', backgroundColor: isDark ? '#1E293B' : '#F3F4F6' }} 
                    />
                  )}
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.meta, isDark && { color: '#94A3B8' }]}>
              {formatDate(tx.date)} · {formatTime(tx.date)} ·{" "}
              {tx.paymentMethod || "No method"}
            </Text>
            {tx.isScheduled && (
              <Text style={[styles.meta, { color: '#38BDF8', marginTop: 4, fontWeight: '600' }]}>
                📅 Scheduled{tx.scheduledAt ? ` for ${formatDate(tx.scheduledAt)} ${formatTime(tx.scheduledAt)}` : ''}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.amountCol}>
          <Text
            style={[
              styles.amount,
              { color: isIn ? (isDark ? '#4ADE80' : colors.success) : (isDark ? '#F87171' : colors.danger) },
            ]}
          >
            {amountText}
          </Text>
          {hasGst && (
            <Text style={[styles.gstText, isDark && { color: '#94A3B8' }]}>
              GST {tx.gstRate}% · ₹{gstTotal.toFixed(2)}
            </Text>
          )}
        </View>
      </View>

      {tx.note ? (
        <Text style={[styles.note, isDark && { color: '#64748B' }]} numberOfLines={2}>
          {tx.note}
        </Text>
      ) : null}

      <View style={styles.footerRow}>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {hasGst && (
            <View style={[styles.tag, isDark && { backgroundColor: 'rgba(45,140,255,0.2)' }]}>
              <Text style={[styles.tagText, isDark && { color: '#38BDF8' }]}>GST applied</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => onDelete(tx.id)}
          style={[styles.deleteBtn, isDark && { backgroundColor: 'rgba(239,68,68,0.2)' }]}
        >
          <Feather name="trash-2" size={16} color={isDark ? '#F87171' : colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  category: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  meta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  amountCol: {
    alignItems: "flex-end",
  },
  amount: { fontSize: 14, fontWeight: "700" },
  gstText: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  note: { marginTop: 6, fontSize: 12, color: colors.textMuted },
  footerRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.bgPrimaryLight,
    borderRadius: 999,
  },
  tagText: { fontSize: 10, color: colors.primary, fontWeight: "600" },
  deleteBtn: {
    padding: 6,
    backgroundColor: colors.bgDangerLight,
    borderRadius: 999,
  },
});
