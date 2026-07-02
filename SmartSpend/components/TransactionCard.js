// components/TransactionCard.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "../theme/colors";
import { formatDate, formatTime } from "../utils/dateUtils";

export default function TransactionCard({
  tx,
  privateMode,
  onDelete,
}) {
  const isIn = tx.type === "in";
  const amountText = privateMode ? "••••" : `₹${tx.amount.toFixed(2)}`;
  const hasGst = tx.isGstApplied && tx.gstRate > 0;
  const gstTotal = (tx.cgst || 0) + (tx.sgst || 0) + (tx.igst || 0);

  return (
    <View style={styles.card}>
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
            <Text style={styles.category} numberOfLines={1}>
              {tx.category || (isIn ? "Cash-in" : "Cash-out")}
            </Text>
            <Text style={styles.meta}>
              {formatDate(tx.date)} · {formatTime(tx.date)} ·{" "}
              {tx.paymentMethod || "No method"}
            </Text>
            {tx.isScheduled && (
              <Text style={[styles.meta, { color: '#2563EB', marginTop: 4, fontWeight: '600' }]}>
                📅 Scheduled{tx.scheduledAt ? ` for ${formatDate(tx.scheduledAt)} ${formatTime(tx.scheduledAt)}` : ''}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.amountCol}>
          <Text
            style={[
              styles.amount,
              { color: isIn ? colors.success : colors.danger },
            ]}
          >
            {amountText}
          </Text>
          {hasGst && (
            <Text style={styles.gstText}>
              GST {tx.gstRate}% · ₹{gstTotal.toFixed(2)}
            </Text>
          )}
        </View>
      </View>

      {tx.note ? (
        <Text style={styles.note} numberOfLines={2}>
          {tx.note}
        </Text>
      ) : null}

      <View style={styles.footerRow}>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {hasGst && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>GST applied</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => onDelete(tx.id)}
          style={styles.deleteBtn}
        >
          <Feather name="trash-2" size={16} color={colors.danger} />
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
