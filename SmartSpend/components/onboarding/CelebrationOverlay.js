import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, Text, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

export default function CelebrationOverlay({ visible, onClose, title = "Awesome!", message = "You're all set up." }) {
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        onClose();
      }, 4000); // auto close after 4s
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.overlay}>
        
        <LottieView
          source={require('../../assets/lottie/confetti.json')} // Ensure this exists or provide fallback
          autoPlay
          loop={false}
          style={styles.lottie}
        />

        <Animated.View entering={ZoomIn.springify()} style={styles.card}>
          <View style={styles.iconWrapper}>
            <Feather name="award" size={40} color="#16A34A" />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>Let's go</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  lottie: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    maxWidth: 340,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 20,
  },
  iconWrapper: {
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#BBF7D0',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#232333',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#747487',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  btn: {
    backgroundColor: '#2D8CFF',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  }
});
