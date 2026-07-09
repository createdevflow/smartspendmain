import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { api } from "../utils/api";
import { AuthContext } from "../context/AuthContext";
import RazorpayCheckout from "../components/RazorpayCheckout";

export default function PlansScreen({ navigation }) {
  const { user, updateProfileInContext } = useContext(AuthContext);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribingTo, setSubscribingTo] = useState(null);
  const [expandedPlans, setExpandedPlans] = useState({});
  const [billingCycle, setBillingCycle] = useState("monthly"); // "weekly", "monthly", "yearly"

  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [checkoutOptions, setCheckoutOptions] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get("/plans");
      setPlans(res.data?.data || []);
    } catch (e) {
      Alert.alert("Error", "Could not load plans");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan) => {
    if (user?.plan?.id === plan.id) {
      Alert.alert("Already Subscribed", `You are already on the ${plan.name} plan.`);
      return;
    }

    setSubscribingTo(plan.id);
    try {
      // 1. Create Order on Backend
      const res = await api.post('/payment/create-order', {
        planId: plan.id,
        billingCycle, // 'weekly', 'monthly', 'yearly'
      });
      
      const { order, key, amount, currency } = res.data.data;
      
      // 2. Prepare Razorpay Options
      const options = {
        key,
        amount,
        currency,
        name: 'SmartSpend',
        description: `Upgrade to ${plan.name}`,
        image: 'https://cdn-icons-png.flaticon.com/512/5501/5501375.png',
        order_id: order.id,
        prefill: {
          email: user?.email || '',
          name: user?.fullName || '',
        },
        theme: { color: plan.color || '#2D8CFF' }
      };

      setCheckoutOptions(options);
      setCheckoutVisible(true);
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to initialize payment.");
    } finally {
      setSubscribingTo(null);
    }
  };

  const handlePaymentSuccess = async (data) => {
    setCheckoutVisible(false);
    try {
      // 3. Verify Payment
      const res = await api.post('/payment/verify', {
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
      });

      Alert.alert("Success", "Your subscription was upgraded successfully!");
      
      // Refresh profile
      const profileRes = await api.get("/users/profile");
      if (updateProfileInContext) {
        updateProfileInContext(profileRes.data?.data || profileRes.data);
      }
    } catch (e) {
      Alert.alert("Verification Failed", e.response?.data?.message || "Payment verification failed.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription Plans</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#2D8CFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Plans</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Free Trial Banner */}
      {user?.trialExpiresAt && new Date(user.trialExpiresAt) > new Date() && (
        <View style={styles.trialBanner}>
          <View style={{ flexDirection: 'column', gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.trialEmoji}>🎉</Text>
              <Text style={styles.trialText}>Free trial enjoy all pro features</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Text style={{ fontSize: 10, color: '#2D8CFF', marginLeft: 24, textDecorationLine: 'underline' }}>*T&C apply (See Terms in Settings)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Billing Cycle Toggle */}
      <View style={styles.cycleToggleContainer}>
        {['weekly', 'monthly', 'yearly'].map((cycle) => (
          <TouchableOpacity
            key={cycle}
            style={[styles.cycleBtn, billingCycle === cycle && styles.cycleBtnActive]}
            onPress={() => setBillingCycle(cycle)}
          >
            <Text style={[styles.cycleBtnText, billingCycle === cycle && styles.cycleBtnTextActive]}>
              {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {plans.map((plan) => {
          const isCurrentPlan = user?.plan?.id === plan.id;
          
          return (
            <View key={plan.id} style={[styles.planCard, isCurrentPlan && styles.currentPlanCard, { borderTopColor: plan.color || "#2D8CFF" }]}>
              {isCurrentPlan && (
                <View style={[styles.currentBadge, { backgroundColor: plan.color || "#2D8CFF" }]}>
                  <Text style={styles.currentBadgeText}>CURRENT PLAN</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  {plan.tagline && <Text style={styles.planTagline}>{plan.tagline}</Text>}
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.planPrice}>
                    {billingCycle === 'weekly' && plan.priceWeekly > 0 ? `₹${plan.priceWeekly}` 
                      : billingCycle === 'yearly' && plan.priceYearly > 0 ? `₹${plan.priceYearly}`
                      : plan.priceMonthly > 0 ? `₹${plan.priceMonthly}` : "Free"}
                  </Text>
                  {(plan.priceMonthly > 0 || plan.priceYearly > 0 || plan.priceWeekly > 0) && (
                    <Text style={styles.planPeriod}>/{billingCycle === 'yearly' ? 'year' : billingCycle === 'weekly' ? 'week' : 'month'}</Text>
                  )}
                </View>
              </View>

              {plan.description && (
                <Text style={styles.planDescription}>{plan.description}</Text>
              )}

              <View style={styles.featuresList}>
                {plan.features.slice(0, expandedPlans[plan.id] ? undefined : 4).map((pf) => {
                  const isAvailable = pf.value !== "false" && pf.value !== "0";
                  return (
                    <View key={pf.feature.id || pf.feature.key} style={styles.featureRow}>
                      <Feather 
                        name={isAvailable ? "check" : "x"} 
                        size={16} 
                        color={isAvailable ? "#059669" : "#DC2626"} 
                      />
                      <Text style={[styles.featureText, !isAvailable && styles.featureTextDisabled]}>
                        {pf.feature.name}
                        {pf.value !== "true" && pf.value !== "false" ? `: ${pf.value}` : ""}
                        {pf.feature.unit ? ` ${pf.feature.unit}` : ""}
                      </Text>
                    </View>
                  );
                })}
                {plan.features.length > 4 && (
                  <TouchableOpacity
                    style={styles.showMoreBtn}
                    onPress={() => setExpandedPlans(prev => ({ ...prev, [plan.id]: !prev[plan.id] }))}
                  >
                    <Text style={styles.showMoreText}>
                      {expandedPlans[plan.id] ? "Show less" : `Show ${plan.features.length - 4} more`}
                    </Text>
                    <Feather name={expandedPlans[plan.id] ? "chevron-up" : "chevron-down"} size={14} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.subscribeBtn,
                  isCurrentPlan ? styles.subscribeBtnDisabled : { backgroundColor: plan.color || "#2D8CFF" }
                ]}
                disabled={isCurrentPlan || subscribingTo === plan.id}
                onPress={() => handleSubscribe(plan)}
              >
                {subscribingTo === plan.id ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={[styles.subscribeBtnText, isCurrentPlan && styles.subscribeBtnTextDisabled]}>
                    {isCurrentPlan ? "Current Plan" : "Select Plan"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>

      <RazorpayCheckout 
        visible={checkoutVisible}
        onClose={() => setCheckoutVisible(false)}
        options={checkoutOptions}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setCheckoutVisible(false)}
        onError={(err) => {
          setCheckoutVisible(false);
          Alert.alert("Payment Failed", err?.description || "The payment was not completed.");
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FB" },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.1)",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  scroll: { flex: 1 },
  content: { padding: 16 },

  cycleToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 4,
  },
  cycleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cycleBtnActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cycleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  cycleBtnTextActive: {
    color: '#0F172A',
  },

  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderTopWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    position: "relative",
    overflow: "hidden",
  },
  currentPlanCard: {
    borderColor: "#93C5FD",
    borderWidth: 2,
    borderTopWidth: 4,
  },
  currentBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  currentBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    marginTop: 8,
  },
  planName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
  },
  planTagline: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },
  planPeriod: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "right",
  },
  planDescription: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresList: {
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
    paddingTop: 16,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: "#334155",
    marginLeft: 10,
    flex: 1,
  },
  featureTextDisabled: {
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  subscribeBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  subscribeBtnDisabled: {
    backgroundColor: "#F1F5F9",
  },
  subscribeBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  subscribeBtnTextDisabled: {
    color: "#94A3B8",
  },
  showMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 6,
    paddingBottom: 4,
    gap: 4,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
});
