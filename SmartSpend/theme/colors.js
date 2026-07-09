// theme/colors.js — Cashtro Brand Identity & Color System
export default {
  // Brand Foundation
  background: "#FFFFFF",
  card: "#FCFCFD",
  cardElevated: "#F8FAFC",
  border: "rgba(116,116,135,0.2)",
  
  // Typography
  text: "#232333", // Primary Text (Titles, Headings, Numbers)
  textMuted: "#747487", // Secondary Text (Descriptions, Captions, Dates)
  
  // Primary Blue (#2D8CFF) — 15-20% of UI
  primary: "#2D8CFF",
  primaryHover: "#1D7AF0",
  primaryPressed: "#1668D8",
  
  // Accent Orange (#F26D21) — ~5% of UI (Attention, Highlights, Pending)
  accent: "#F26D21",
  
  // Semantic Colors
  success: "#16A34A", // Income, Paid, Completed, Positive Growth
  danger: "#DC2626", // Expense, Failed, Delete, Overdue
  warning: "#F26D21", // Accent Orange used for warnings & pending
  info: "#2D8CFF", // Info, Savings, Transfer
  neutral: "#747487",

  // Blue Shades (Derived from #2D8CFF)
  primary50: "#EFF6FF", // Background tints, selected rows
  primary100: "#DBEAFE", // Hover backgrounds
  primary200: "#BFDBFE", // Soft badges
  primary500: "#2D8CFF", // Main brand color
  primary600: "#1D7AF0", // Hover state
  primary700: "#1668D8", // Pressed state

  // Light backgrounds & Tints
  bgPrimaryLight: "#EFF6FF",
  bgSuccessLight: "#DCFCE7",
  bgDangerLight: "#FEE2E2",
  bgWarningLight: "#FFEDD5",
  bgMutedLight: "#F8FAFC",

  // Graph bars & Financial Identity
  graphIn: "#16A34A", // Income (Green)
  graphOut: "#DC2626", // Expense (Red)
  graphSavings: "#2D8CFF", // Savings (Blue)
  graphInvest: "#F26D21", // Investment (Orange)

  // Shadows
  shadow: "rgba(35,35,51,0.08)",
};
