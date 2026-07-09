import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

const CURRENT_VERSION = '1.0.0'; // Update this to show modal again
const STORAGE_KEY = '@whats_new_version';

const UPDATES = [
  { icon: 'book-open', title: 'Shared Cashbooks', desc: 'Invite friends and team members to collaborate on a single cashbook in real-time.' },
  { icon: 'pie-chart', title: 'Interactive Dashboard', desc: 'A brand new dashboard with an interactive balance card and deeper AI insights.' },
  { icon: 'bell', title: 'Payment Reminders', desc: 'Set up recurring transactions and scheduled reminders for yourself or clients.' },
];

export default function WhatsNewModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    checkVersion();
  }, []);

  const checkVersion = async () => {
    try {
      const storedVersion = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedVersion !== CURRENT_VERSION) {
        setVisible(true);
      }
    } catch (e) {
      console.error('Error checking version', e);
    }
  };

  const handleClose = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
      setVisible(false);
    } catch (e) {
      console.error('Error setting version', e);
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <Animated.View entering={FadeIn} style={styles.overlay}>
        <Animated.View entering={SlideInDown.springify().damping(20)} style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <Feather name="zap" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.title}>What's New</Text>
            <Text style={styles.subtitle}>Check out the latest features</Text>
          </View>

          <View style={styles.list}>
            {UPDATES.map((u, i) => (
              <View key={i} style={styles.item}>
                <View style={styles.itemIcon}>
                  <Feather name={u.icon} size={20} color="#2D8CFF" />
                </View>
                <View style={styles.itemText}>
                  <Text style={styles.itemTitle}>{u.title}</Text>
                  <Text style={styles.itemDesc}>{u.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleClose} activeOpacity={0.8}>
            <Text style={styles.btnText}>Got it, let's go!</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#232333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#747487',
  },
  list: {
    marginBottom: 32,
  },
  item: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#232333',
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 14,
    color: '#747487',
    lineHeight: 20,
  },
  btn: {
    backgroundColor: '#2D8CFF',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  }
});
