import React, { useContext } from "react";
import { StatusBar, View, Text, ActivityIndicator, TouchableOpacity, Image, Platform } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Feather } from "@expo/vector-icons";
import * as Notifications from 'expo-notifications';
import Toast from 'react-native-toast-message';
import { api } from './utils/api';

// ── Global Error Interceptor ────────────────────────────────────────────────
const originalConsoleError = console.error;
console.error = (...args) => {
  originalConsoleError(...args);
  
  let msg = 'An unexpected error occurred';
  for (const arg of args) {
    if (arg && arg.message) { msg = arg.message; break; }
    else if (typeof arg === 'string' && !arg.includes('react-native') && !arg.includes('Warning')) {
      msg = arg; break;
    }
  }

  // Use toast
  if (Toast && Toast.show) {
    Toast.show({
      type: 'error',
      text1: 'Oops!',
      text2: msg.substring(0, 100),
      visibilityTime: 4000,
      position: 'bottom',
    });
  }
};

// Contexts
import { BooksProvider } from "./context/BooksContext";
import { TransactionsProvider } from "./context/TransactionsContext";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { AppConfigProvider, useAppConfig } from "./context/AppConfigContext";
import { ChatProvider, useChat } from "./context/ChatContext";
import { WealthProvider } from "./context/WealthContext";
import { InvoiceProvider } from "./context/InvoiceContext";
import { useFeatureAccess } from "./hooks/useFeatureAccess";
import { OnboardingProvider } from "./context/OnboardingContext";

// Components
import ShakeDetector from "./components/ShakeDetector";

// Main Screens
import HomeScreen from "./screens/HomeScreen";
import BooksScreen from "./screens/BooksScreen";
import TransactionsScreen from "./screens/TransactionsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import PlansScreen from "./screens/PlansScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import ChatListScreen from "./screens/ChatListScreen";
import ChatScreen from "./screens/ChatScreen";
import ContactRequestsScreen from "./screens/ContactRequestsScreen";
import WealthHubScreen from "./screens/WealthHubScreen";
import InvoiceScreen from "./screens/InvoiceScreen";
import InvoiceCreateScreen from "./screens/InvoiceCreateScreen";
import InvoiceDetailScreen from "./screens/InvoiceDetailScreen";
import InvoiceSettingsScreen from "./screens/InvoiceSettingsScreen";
import SubscriptionsScreen from "./screens/SubscriptionsScreen";
import CommunicationScreen from "./screens/CommunicationScreen";
import StarredMessagesScreen from "./screens/StarredMessagesScreen";
import ChatMediaGalleryScreen from "./screens/ChatMediaGalleryScreen";
import PaymentReminderScreen from "./screens/PaymentReminderScreen";
import AIInsightsScreen from "./screens/AIInsightsScreen";

// Onboarding
import WelcomeFlow from './screens/onboarding/WelcomeFlow';
import { TourGuideProvider } from './components/onboarding/TourGuide';
import { useOnboarding } from './context/OnboardingContext';

// Auth Screens
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import OtpScreen from "./screens/OtpScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

// ── Push Notification Setup ─────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData?.data ?? null;
  } catch (e) {
    console.warn('[Push] Token registration failed:', e.message);
    return null;
  }
}

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#F5F7FB",
    card: "#FFFFFF",
    text: "#232333",
    border: "rgba(15, 23, 42, 0.06)",
    primary: "#2D8CFF",
  },
};

// ── Maintenance Mode Screen ─────────────────────────────────────────────────
function MaintenanceScreen({ onRetry }) {
  return (
    <View style={{
      flex: 1, alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#FFFFFF', padding: 32,
    }}>
      <Text style={{ fontSize: 56, marginBottom: 24 }}>🔧</Text>
      <Text style={{
        fontSize: 24, fontWeight: '800', color: '#232333',
        marginBottom: 12, textAlign: 'center',
      }}>
        We&apos;ll Be Back Soon
      </Text>
      <Text style={{
        fontSize: 15, color: '#747487', textAlign: 'center',
        lineHeight: 24, marginBottom: 32,
      }}>
        Cashtro is currently undergoing scheduled maintenance.
        We&apos;re working to make things better for you. Please check back shortly.
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        style={{
          backgroundColor: '#2D8CFF', paddingHorizontal: 28,
          paddingVertical: 14, borderRadius: 12,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Try Again</Text>
      </TouchableOpacity>
      <Text style={{ color: '#747487', fontSize: 12, marginTop: 24 }}>
        Cashtro v1.0.0
      </Text>
    </View>
  );
}

// ── Error Boundary ──────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{
          flex: 1, alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#FFF', padding: 32,
        }}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>⚠️</Text>
          <Text style={{
            fontSize: 20, fontWeight: '700', color: '#232333', marginBottom: 8,
            textAlign: 'center',
          }}>
            Something went wrong
          </Text>
          <Text style={{ color: '#747487', textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
            The app encountered an unexpected error. Please restart the app.
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{
              backgroundColor: '#2D8CFF', paddingHorizontal: 24,
              paddingVertical: 12, borderRadius: 10,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Try to Recover</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

// ── Main Tab Navigator ──────────────────────────────────────────────────────
function MainTabs() {
  const { hasAccess, getFeatureTease } = useFeatureAccess();
  const { totalUnread } = useChat();
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBarPosition="bottom"
      screenOptions={({ route }) => ({
        swipeEnabled: true,
        animationEnabled: true,
        tabBarShowLabel: true,
        tabBarLabel: ({ focused, color }) => {
          let label = route.name;
          if (route.name === 'Books') label = 'Cashbooks';
          return (
            <Text 
              numberOfLines={1} 
              adjustsFontSizeToFit 
              style={{ fontSize: 10, color, fontWeight: focused ? '700' : '600', marginTop: -4, textAlign: 'center' }}
            >
              {label}
            </Text>
          );
        },
        tabBarActiveTintColor: "#2D8CFF",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarIndicatorStyle: {
          backgroundColor: "#2D8CFF",
          height: 3,
          borderRadius: 999,
          top: 0,
        },
        tabBarIndicatorContainerStyle: {
          top: 0,
          bottom: undefined,
        },
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          height: Platform.OS === 'android' ? 60 + insets.bottom : 56 + insets.bottom,
          paddingBottom: insets.bottom,
          borderTopWidth: 0.5,
          borderTopColor: "rgba(148,163,184,0.4)",
          elevation: 16,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 8,
        },
        tabBarItemStyle: {
          paddingVertical: Platform.OS === 'android' ? 6 : 4,
        },
        tabBarIcon: ({ focused, color }) => {
          let icon = "circle";
          if (route.name === "Home") icon = "home";
          else if (route.name === "Books") icon = "book-open";
          else if (route.name === "Transactions") icon = "file-text";
          else if (route.name === "Chat") icon = "message-circle";
          else if (route.name === "Settings") icon = "settings";

          return <Feather name={icon} size={22} color={color} />;
        },
      })}
    >
      {/* Home tab */}
      <Tab.Screen name="Home" component={HomeScreen} />
      
      {/* Cashbooks tab */}
      {(hasAccess("feature_cashbooks") || getFeatureTease("feature_cashbooks")) && (
        <Tab.Screen name="Books" component={BooksScreen} />
      )}

      {/* Transactions tab */}
      {(hasAccess("feature_transactions") || getFeatureTease("feature_transactions")) && (
        <Tab.Screen name="Transactions" component={TransactionsScreen} />
      )}

      {/* Chat tab with dynamic badge based on unread count */}
      {(hasAccess("feature_chat") || getFeatureTease("feature_chat")) && (
        <Tab.Screen 
          name="Chat" 
          component={ChatListScreen} 
          options={{
            tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
            tabBarBadgeStyle: { backgroundColor: '#EF4444', color: '#FFF' },
          }}
        />
      )}

      {/* Settings tab */}
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const MainTabsWithTour = () => (
  <MainTabs />
);

// ── Root Navigator with Maintenance + Auth ─────────────────────────────────
function RootNavigator() {
  const { user, isLoading } = useContext(AuthContext);
  const { isMaintenanceMode, refreshConfig, isLoading: configLoading } = useAppConfig();
  const { hasSeenWelcome, loading: onboardingLoading } = useOnboarding();

  // Register push notification token when user logs in
  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    registerForPushNotificationsAsync().then(token => {
      if (!token || cancelled) return;
      api.patch('/users/push-token', { token }).catch(() => {});
    });
    
    // Add foreground and background listeners
    const foregroundSub = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Push] Notification received in foreground:', notification);
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[Push] User tapped notification:', response);
      // Navigation could be handled here based on response.notification.request.content.data
    });

    return () => { 
      cancelled = true; 
      foregroundSub.remove();
      responseSub.remove();
    };
  }, [user?.id]);

  if (isLoading || configLoading || onboardingLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" }}>
        <Image
          source={require('./assets/images/cashtro-splash.png')}
          style={{ width: 240, height: 140, resizeMode: 'contain', marginBottom: 32 }}
        />
        <ActivityIndicator size="small" color="#2D8CFF" />
      </View>
    );
  }

  // Show maintenance screen for all users (including logged-in)
  if (isMaintenanceMode) {
    return <MaintenanceScreen onRetry={refreshConfig} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        !hasSeenWelcome ? (
          <Stack.Screen name="Welcome" component={WelcomeFlow} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabsWithTour} />
            <Stack.Screen name="Wealth" component={WealthHubScreen} />
            <Stack.Screen name="Invoices" component={InvoiceScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Plans" component={PlansScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="ChatRoom" component={ChatScreen} options={{ gestureEnabled: true }} />
            <Stack.Screen name="ContactRequests" component={ContactRequestsScreen} />
            <Stack.Screen name="InvoiceCreate" component={InvoiceCreateScreen} />
            <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
            <Stack.Screen name="InvoiceSettings" component={InvoiceSettingsScreen} />
            <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} />
            <Stack.Screen name="Communication" component={CommunicationScreen} />
            <Stack.Screen name="Chat" component={ChatListScreen} />
            <Stack.Screen name="StarredMessages" component={StarredMessagesScreen} />
            <Stack.Screen name="ChatMediaGallery" component={ChatMediaGalleryScreen} />
            <Stack.Screen name="PaymentReminder" component={PaymentReminderScreen} />
            <Stack.Screen name="AIInsights" component={AIInsightsScreen} />
          </>
        )
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Otp" component={OtpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

// ── App Root ────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AppConfigProvider>
            <AuthProvider>
              <OnboardingProvider>
                <TourGuideProvider>
                  <BooksProvider>
                  <TransactionsProvider>
                    <WealthProvider>
                      <InvoiceProvider>
                        <ChatProvider>
                          <BottomSheetModalProvider>
                            <ShakeDetector />
                            <NavigationContainer theme={LightTheme}>
                              <StatusBar barStyle="dark-content" backgroundColor="#F5F7FB" />
                              <RootNavigator />
                            </NavigationContainer>
                            <Toast />
                          </BottomSheetModalProvider>
                        </ChatProvider>
                      </InvoiceProvider>
                    </WealthProvider>
                  </TransactionsProvider>
                  </BooksProvider>
                </TourGuideProvider>
              </OnboardingProvider>
            </AuthProvider>
          </AppConfigProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
