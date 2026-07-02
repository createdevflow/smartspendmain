# SmartSpend - Project Overview

## 📱 About The Project
**SmartSpend** is a personal finance and cashbook management mobile application built with React Native and Expo. It allows users to track their daily cashflow (cash-in and cash-out), manage multiple separate "cashbooks" (e.g., Shop, Family, Personal), and keep tabs on monthly budgets and savings goals. 

The application is completely localized, relying on device storage to keep the user's financial data private and secure.

## 🛠️ Technology Stack
- **Framework**: React Native with Expo
- **Navigation**: React Navigation (`@react-navigation/native`, `@react-navigation/material-top-tabs`) configured to act as a swipeable bottom tab bar.
- **State Management**: React Context API (`BooksContext`, `TransactionsContext`)
- **Data Persistence**: Local Storage via `@react-native-async-storage/async-storage`
- **Icons**: `@expo/vector-icons` (Feather, MaterialIcons)
- **UI & Styling**: Custom styling with React Native `StyleSheet`, utilizing a custom defined theme and color palette.

## ✨ Key Features
1. **Multiple Cashbooks**: Users can create distinct cashbooks (identified by name, description, and color) to separate different types of finances.
2. **Transaction Tracking**: Record cash-in and cash-out entries tied to specific cashbooks, along with categories, payment methods, and notes.
3. **Dashboard & Analytics**: 
   - View current balance, total cash-in, and total cash-out.
   - Interactive 7-day cashflow graph.
   - Quick overview of recent transactions.
4. **Budgeting & Goals**: Set and monitor a monthly budget and a specific savings goal.
5. **Privacy Mode**: A toggleable "Private Mode" that masks sensitive monetary values (e.g., `••••`) from prying eyes.
6. **Advanced Toggles**: Support for GST tracking and transaction round-ups (configurable in settings).

## 📂 Project Structure

```text
SmartSpend/
├── App.js                   # Application entry point, sets up Context Providers and Tab Navigation
├── components/              # Reusable UI components
│   ├── FAB.js               # Floating Action Button
│   ├── GraphCard.js         # Component for rendering data charts
│   ├── PremiumCard.js       # UI card for premium features
│   ├── SwipeTabsWrapper.js  # Wrapper to enable swipeable gestures across main tabs
│   └── TransactionCard.js   # UI component displaying individual transaction details
├── context/                 # Global state management
│   ├── BooksContext.js        # Manages cashbooks (creation, selection, persistence)
│   └── TransactionsContext.js # Manages transactions and user settings (budget, privacy, etc.)
├── screens/                 # Main application screens (Tabs)
│   ├── HomeScreen.js        # Dashboard, balances, and recent activity
│   ├── BooksScreen.js       # Cashbook management
│   ├── TransactionsScreen.js# Full transaction history and entry creation
│   └── SettingsScreen.js    # User preferences, budget, goals, and data management
├── theme/                   # Shared styling and design tokens
│   ├── colors.js            # Centralized color palette
│   └── styles.js            # Common stylesheets
├── utils/                   # Helper functions and utilities
│   ├── dateUtils.js         # Date formatting and parsing helpers
│   └── reporting.js         # Logic for aggregating and analyzing transaction data
└── package.json             # Project dependencies and scripts
```

## 💾 Data Architecture
The app stores data locally using `AsyncStorage`. There are two primary data silos:
- **`@smartspend_books_v1`**: Stores the array of cashbook objects and the ID of the currently active book.
- **`@smartspend_transactions_v1`**: Stores the array of all transactions across all books, alongside user settings like `gstEnabled`, `roundUpEnabled`, `privateMode`, `monthlyBudget`, and `savingsGoal`.

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Run the Application**:
   ```bash
   npm start
   ```
   Choose `a` for Android, `i` for iOS, or scan the QR code using the Expo Go app.
