// components/FAB.js
import React from "react";
import { TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "../theme/colors";

export default function FAB({ onPress, icon = "plus" }) {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress}>
      <Feather name={icon} size={24} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,

    // 👇 bring it MUCH closer to the bottom tabs
    bottom: Platform.OS === "ios" ? 40 : 24,

    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",

    // shadow for iOS
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },

    // shadow for Android
    elevation: 8,
  },
});
