import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';

export default function LegalWebViewScreen({ route, navigation }) {
  const { url, title } = route.params;
  const { isDark, theme } = useAppTheme();
  const [loading, setLoading] = useState(true);

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, isDark && { borderBottomColor: 'rgba(255,255,255,0.08)' }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="arrow-left" size={24} color={isDark ? '#F8FAFC' : '#111827'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && { color: '#F8FAFC' }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.webviewContainer}>
        <WebView 
          source={{ uri: url }} 
          style={styles.webview}
          onLoadEnd={() => setLoading(false)}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2D8CFF" />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  webviewContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
