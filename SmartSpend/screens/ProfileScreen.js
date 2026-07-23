import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Pressable,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { AuthContext } from "../context/AuthContext";
import { api } from "../utils/api";
import { useFeatureAccess } from "../hooks/useFeatureAccess";
import OptimizedImage from "../components/OptimizedImage";
import { useAppTheme } from "../context/ThemeContext";

const CURRENCIES = [
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
];

export default function ProfileScreen({ navigation }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const { user, updateProfileInContext } = useContext(AuthContext);
  const { hasAccess: isFeatureEnabled } = useFeatureAccess();

  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  // Profile Form
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [defaultCurrency, setDefaultCurrency] = useState(user ? user.defaultCurrency : "INR");
  const [avatarUri, setAvatarUri] = useState(user?.avatar || null);

  // Sync with context updates
  useEffect(() => {
    setFullName(user?.fullName || "");
    setPhone(user?.phone || "");
    setDefaultCurrency(user?.defaultCurrency || "INR");
    setAvatarUri(user?.avatar || null);
  }, [user?.id]);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [expandedText, setExpandedText] = useState({});
  const [showIdTooltip, setShowIdTooltip] = useState(true);

  const [showTrialBanner, setShowTrialBanner] = useState(true);
  const isTrialActive = user?.trialExpiresAt && new Date(user.trialExpiresAt) > new Date();

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Please allow photo access to upload a profile picture.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setAvatarLoading(true);
        try {
          let base64 = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
          setAvatarUri(asset.uri); // Show locally immediately
          
          // Proactively upload via MediaService
          if (base64.startsWith('data:')) {
            const uploadRes = await api.post('/media/upload-base64', { base64, module: 'users' });
            base64 = uploadRes.data?.data?.url || uploadRes.data?.url || base64;
          }

          const res = await api.post("/users/avatar", { image: base64 });
          if (updateProfileInContext) {
            updateProfileInContext(res.data?.data || res.data);
          }
          Alert.alert("Success", "Profile photo updated!");
        } catch (e) {
          setAvatarUri(user?.avatar || null);
          Alert.alert("Error", e.response?.data?.message || "Failed to upload photo.");
        } finally {
          setAvatarLoading(false);
        }
      }
    } catch (e) {
      Alert.alert("Error", "Could not open photo library.");
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Full name is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.patch("/users/profile", {
        fullName: fullName.trim(),
        phone: phone.trim(),
        defaultCurrency,
      });
      if (updateProfileInContext) {
        updateProfileInContext(res.data?.data || res.data);
      }
      Alert.alert("Success", "Profile updated successfully!");
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters.");
      return;
    }
    setPasswordLoading(true);
    try {
      await api.post("/users/change-password", { currentPassword, newPassword });
      Alert.alert("Success", "Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to change password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === defaultCurrency);
  const initial = fullName ? fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* ── Free Trial Banner ── */}
          {showTrialBanner && isTrialActive && (
            <View style={{ backgroundColor: '#EFF6FF', padding: 12, borderRadius: 12, marginHorizontal: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#BFDBFE' }}>
              <View style={{ flex: 1, flexDirection: 'column', gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Feather name="zap" size={16} color="#F26D21" />
                  <Text style={{ fontSize: 13, color: '#232333', fontWeight: '600' }}>
                    Free trial enjoy all pro features
                  </Text>
                </View>
                <TouchableOpacity onPress={() => Linking.openURL('https://cashtro.in/documents/terms')}>
                  <Text style={{ fontSize: 10, color: '#2D8CFF', marginLeft: 24, textDecorationLine: 'underline' }}>*T&C apply (View Terms of Service)</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => setShowTrialBanner(false)} style={{ padding: 4 }}>
                <Feather name="x" size={16} color="#747487" />
              </TouchableOpacity>
            </View>
          )}

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity 
              onPress={() => isFeatureEnabled('feature_profile_editing') && handlePickPhoto()} 
              activeOpacity={0.8} 
              disabled={avatarLoading || !isFeatureEnabled('feature_profile_editing')}
            >
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarCircle}>
                  {avatarUri ? (
                    <OptimizedImage source={{ uri: avatarUri }} style={styles.avatarImage} size="medium" />
                  ) : (
                    <Text style={styles.avatarText}>{initial}</Text>
                  )}
                  {avatarLoading && (
                    <View style={styles.avatarOverlay}>
                      <ActivityIndicator color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <View style={styles.editAvatarBadge}>
                  <Feather name="camera" size={13} color="#FFF" />
                </View>
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
          </View>

          {/* Personal Info */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Personal Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Feather name="user" size={17} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Your full name"
                  placeholderTextColor="#9CA3AF"
                  editable={isFeatureEnabled('feature_profile_editing')}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address (Locked)</Text>
              <View style={[styles.inputContainer, styles.inputDisabled]}>
                <Feather name="mail" size={17} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: "#6B7280" }]}
                  value={user?.email || ""}
                  editable={false}
                />
                <Feather name="lock" size={14} color="#CBD5E1" style={{ marginRight: 14 }} />
              </View>
              <Text style={styles.inputHint}>Email cannot be changed for security reasons.</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Feather name="phone" size={17} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  editable={isFeatureEnabled('feature_profile_editing')}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Default Currency</Text>
              <TouchableOpacity 
                style={styles.inputContainer} 
                onPress={() => isFeatureEnabled('feature_profile_editing') && setShowCurrencyPicker(true)} 
                activeOpacity={0.7}
              >
                <Feather name="globe" size={17} color="#94A3B8" style={styles.inputIcon} />
                <Text style={{ flex: 1, color: "#111827", fontSize: 14 }}>
                  {selectedCurrency ? `${selectedCurrency.symbol} ${selectedCurrency.name} (${selectedCurrency.code})` : defaultCurrency}
                </Text>
                <Feather name="chevron-down" size={17} color="#94A3B8" style={{ marginRight: 14 }} />
              </TouchableOpacity>
            </View>

            {isFeatureEnabled('feature_profile_editing') ? (
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            ) : (
              <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginTop: 10 }}>
                Profile editing is disabled by your administrator.
              </Text>
            )}
          </View>

          {/* Security */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Security & Password</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password</Text>
              <View style={styles.inputContainer}>
                <Feather name="shield" size={17} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showCurrent}
                />
                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={{ paddingHorizontal: 14 }}>
                  <Feather name={showCurrent ? "eye-off" : "eye"} size={17} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputContainer}>
                <Feather name="lock" size={17} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Min. 8 characters"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showNew}
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)} style={{ paddingHorizontal: 14 }}>
                  <Feather name={showNew ? "eye-off" : "eye"} size={17} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <Feather name="check-circle" size={17} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat new password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showNew}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: "#111827", marginTop: 10 }]}
              onPress={handleChangePassword}
              disabled={passwordLoading}
            >
              {passwordLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Account Info */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Account Details</Text>
            <View style={[styles.infoRow, { position: "relative" }]}>
              <Text style={styles.infoLabel}>User ID</Text>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", flex: 1, paddingLeft: 20 }}>
                <TouchableOpacity 
                  onPress={() => {
                    setExpandedText(prev => ({ ...prev, userId: !prev.userId }));
                    setShowIdTooltip(false);
                  }} 
                  style={{ flex: 1, alignItems: "flex-end" }}
                >
                  <Text style={[styles.infoValue, { textAlign: "right", maxWidth: expandedText.userId ? "100%" : 100 }]} numberOfLines={expandedText.userId ? undefined : 1} ellipsizeMode="middle">
                    {user?.id || "—"}
                  </Text>
                </TouchableOpacity>
                {user?.id && (
                  <TouchableOpacity
                    style={{ marginLeft: 6 }}
                    onPress={async () => {
                      await Clipboard.setStringAsync(user.id);
                      Alert.alert("Copied", "User ID copied to clipboard");
                    }}
                  >
                    <Feather name="copy" size={15} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
              {showIdTooltip && (
                <View style={styles.tooltipBox}>
                  <Text style={styles.tooltipText}>Tap ID to view full</Text>
                  <TouchableOpacity onPress={() => setShowIdTooltip(false)} style={{ marginLeft: 6 }}>
                    <Feather name="x" size={12} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current Plan</Text>
              <TouchableOpacity onPress={() => setExpandedText(prev => ({ ...prev, planName: !prev.planName }))} style={{ flex: 1, alignItems: "flex-end", paddingLeft: 20 }}>
                <Text style={[styles.infoValue, { color: "#2D8CFF", fontWeight: "700", maxWidth: "100%" }]} numberOfLines={expandedText.planName ? undefined : 1} ellipsizeMode="tail">
                  {user?.plan?.name || "Free"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={[styles.infoValue, { maxWidth: "65%" }]} numberOfLines={1}>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>Email Status</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Feather name={user?.isEmailVerified ? "check-circle" : "alert-circle"} size={14} color={user?.isEmailVerified ? "#059669" : "#D97706"} />
                <Text style={[styles.infoValue, { color: user?.isEmailVerified ? "#059669" : "#D97706", maxWidth: "100%" }]} numberOfLines={1}>
                  {user?.isEmailVerified ? "Verified" : "Not Verified"}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Currency Picker Modal */}
      <Modal visible={showCurrencyPicker} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowCurrencyPicker(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
                <Feather name="x" size={22} color="#111827" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CURRENCIES}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.currencyRow, defaultCurrency === item.code && styles.currencyRowSelected]}
                  onPress={() => {
                    setDefaultCurrency(item.code);
                    setShowCurrencyPicker(false);
                  }}
                >
                  <View style={styles.currencySymbolBox}>
                    <Text style={styles.currencySymbol}>{item.symbol}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.currencyCode}>{item.code}</Text>
                    <Text style={styles.currencyName}>{item.name}</Text>
                  </View>
                  {defaultCurrency === item.code && <Feather name="check" size={20} color="#2D8CFF" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getStyles(theme, isDark) { return StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FB" },
  container: { flex: 1 },
  headerBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#F5F7FB",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? theme.colors.card : "#FFFFFF",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(148,163,184,0.2)",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: isDark ? "#F8FAFC" : "#111827" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  // Avatar
  avatarSection: { alignItems: "center", marginBottom: 28 },
  avatarWrapper: { width: 96, height: 96, position: "relative", alignItems: "center", justifyContent: "center" },
  avatarCircle: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: "#2D8CFF",
    alignItems: "center", justifyContent: "center", overflow: "hidden",
    shadowColor: "#2D8CFF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  avatarImage: { width: 92, height: 92 },
  avatarText: { fontSize: 36, fontWeight: "700", color: isDark ? theme.colors.card : "#FFFFFF" },
  avatarOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  editAvatarBadge: {
    position: "absolute", bottom: -2, right: -2, backgroundColor: isDark ? "#F8FAFC" : "#111827",
    width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#F5F7FB", zIndex: 10,
  },
  avatarHint: { marginTop: 10, fontSize: 12, color: "#6B7280" },

  // Section
  section: { backgroundColor: isDark ? theme.colors.card : "#FFFFFF", borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: "rgba(148,163,184,0.15)" },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: isDark ? "#F8FAFC" : "#111827", marginBottom: 16 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "600", color: "#4B5563", marginBottom: 6, marginLeft: 2 },
  inputHint: { fontSize: 11, color: "#9CA3AF", marginTop: 4, marginLeft: 2 },
  inputContainer: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F9FAFB", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", height: 50,
  },
  inputDisabled: { backgroundColor: "#F1F5F9" },
  inputIcon: { paddingHorizontal: 13 },
  input: { flex: 1, height: "100%", color: isDark ? "#F8FAFC" : "#111827", fontSize: 14 },

  saveBtn: { backgroundColor: "#2D8CFF", borderRadius: 12, height: 50, alignItems: "center", justifyContent: "center", marginTop: 6 },
  saveBtnText: { color: isDark ? theme.colors.card : "#FFFFFF", fontSize: 15, fontWeight: "700" },
  saveBtnAlt: {
    backgroundColor: "#EFF6FF", borderRadius: 12, height: 50, alignItems: "center", justifyContent: "center",
    marginTop: 6, borderWidth: 1, borderColor: "#BFDBFE",
  },
  saveBtnAltText: { color: "#2D8CFF", fontSize: 15, fontWeight: "700" },

  // Account Info Rows
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderColor: "rgba(148,163,184,0.12)" },
  infoLabel: { fontSize: 13, color: "#6B7280" },
  infoValue: { fontSize: 13, color: isDark ? "#F8FAFC" : "#111827", fontWeight: "500", maxWidth: "60%", textAlign: "right" },
  tooltipBox: {
    position: "absolute", right: 28, top: -14, backgroundColor: isDark ? "#F8FAFC" : "#111827",
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    flexDirection: "row", alignItems: "center", zIndex: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  tooltipText: { color: isDark ? theme.colors.card : "#FFFFFF", fontSize: 10, fontWeight: "600" },

  // Currency Modal
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: isDark ? theme.colors.card : '#FFFFFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    height: '60%',
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: isDark ? '#F8FAFC' : '#111827' },
  currencyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  currencyRowSelected: { backgroundColor: '#EFF6FF', borderRadius: 12, paddingHorizontal: 12, borderBottomWidth: 0 },
  currencySymbolBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  currencySymbol: { fontSize: 18, fontWeight: '700', color: '#4B5563' },
  currencyCode: { fontSize: 15, fontWeight: '700', color: isDark ? '#F8FAFC' : '#111827' },
  currencyName: { fontSize: 13, color: '#6B7280', marginTop: 2 },
});
}
