// components/GraphCard.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import colors from "../theme/colors";

export default function GraphCard({ title, subtitle, data }) {
  const maxAbs = Math.max(1, ...data.map((x) => Math.abs(x.value)));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.graphRow}>
        {data.map((d) => {
          const height = (Math.abs(d.value) / maxAbs) * 70;
          return (
            <View key={d.label} style={styles.col}>
              <View style={styles.track}>
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor:
                        d.value >= 0 ? colors.graphIn : colors.graphOut,
                    },
                  ]}
                />
              </View>
              <Text style={styles.label}>{d.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  title: { fontSize: 15, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  graphRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 12,
  },
  col: { flex: 1, alignItems: "center" },
  track: {
    height: 80,
    width: 10,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  bar: {
    width: 10,
    borderRadius: 999,
  },
  label: { fontSize: 10, color: "#9CA3AF", marginTop: 4 },
});
