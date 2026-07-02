// components/chat/VoicePlayer.js
// WhatsApp-style voice message player using expo-av
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const WAVEFORM_BARS = 30;

function generateBars() {
  return Array.from({ length: WAVEFORM_BARS }, () => 0.2 + Math.random() * 0.8);
}

function formatDuration(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VoicePlayer({ uri, duration: durationProp, isOwn }) {
  const soundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(durationProp ? durationProp * 1000 : 0);
  const [isLoading, setIsLoading] = useState(false);
  const [bars] = useState(generateBars);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation when playing
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

  // Sync progress bar
  useEffect(() => {
    if (durationMs > 0) {
      const pct = positionMs / durationMs;
      Animated.timing(progressAnim, {
        toValue: pct,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [positionMs, durationMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const loadAndPlay = useCallback(async () => {
    if (!uri) return;
    try {
      setIsLoading(true);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound, status } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPositionMs(status.positionMillis || 0);
            setDurationMs(status.durationMillis || durationMs);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPositionMs(0);
            }
          }
        }
      );
      soundRef.current = sound;
      if (status.durationMillis) setDurationMs(status.durationMillis);
      setIsPlaying(true);
    } catch (e) {
      console.warn('VoicePlayer error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [uri, durationMs]);

  const togglePlay = useCallback(async () => {
    if (!soundRef.current) {
      await loadAndPlay();
      return;
    }
    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) {
      await loadAndPlay();
      return;
    }
    if (status.isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      if (status.didJustFinish || status.positionMillis >= (status.durationMillis || 0) - 100) {
        await soundRef.current.setPositionAsync(0);
      }
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  }, [loadAndPlay]);

  const handleScrub = useCallback(async (pct) => {
    if (!soundRef.current || durationMs === 0) return;
    const pos = Math.floor(pct * durationMs);
    await soundRef.current.setPositionAsync(pos);
    setPositionMs(pos);
  }, [durationMs]);

  const pct = durationMs > 0 ? positionMs / durationMs : 0;
  const remaining = durationMs > 0 ? durationMs - positionMs : (durationProp ? durationProp * 1000 : 0);

  const themeColor = isOwn ? '#fff' : '#1D4ED8';
  const trackBg = isOwn ? 'rgba(255,255,255,0.25)' : '#E0E7FF';
  const fillColor = isOwn ? '#fff' : '#1D4ED8';

  return (
    <View style={[vp.wrap, isOwn && vp.wrapOwn]}>
      {/* Play/Pause Button */}
      <TouchableOpacity onPress={togglePlay} disabled={isLoading} style={vp.playBtn} activeOpacity={0.8}>
        <Animated.View style={[vp.playBtnInner, isOwn && vp.playBtnOwn, { transform: [{ scale: pulseAnim }] }]}>
          {isLoading ? (
            <View style={vp.loadingDot} />
          ) : (
            <Feather
              name={isPlaying ? 'pause' : 'play'}
              size={18}
              color={isOwn ? '#1D4ED8' : '#fff'}
              style={!isPlaying && { marginLeft: 2 }}
            />
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Waveform + Progress */}
      <View style={vp.waveArea}>
        {/* Waveform bars (tappable for scrub) */}
        <TouchableOpacity
          style={vp.waveform}
          activeOpacity={1}
          onPress={(e) => {
            // rough scrub via tap position
          }}
        >
          {bars.map((h, i) => {
            const barPct = i / WAVEFORM_BARS;
            const played = barPct <= pct;
            return (
              <View
                key={i}
                style={[
                  vp.bar,
                  {
                    height: Math.max(4, h * 28),
                    backgroundColor: played ? fillColor : trackBg,
                    opacity: played ? 1 : 0.45,
                  },
                ]}
              />
            );
          })}
        </TouchableOpacity>

        {/* Progress Bar (thin line below) */}
        <View style={[vp.track, { backgroundColor: trackBg }]}>
          <Animated.View
            style={[
              vp.fill,
              {
                backgroundColor: fillColor,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Duration */}
        <Text style={[vp.duration, { color: themeColor }]}>
          {isPlaying || positionMs > 0 ? formatDuration(positionMs) : formatDuration(remaining)}
        </Text>
      </View>
    </View>
  );
}

const vp = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 6, minWidth: 200, maxWidth: 260,
  },
  wrapOwn: {},
  playBtn: { flexShrink: 0 },
  playBtnInner: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1D4ED8', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1D4ED8', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  playBtnOwn: {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.15,
  },
  loadingDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff',
  },
  waveArea: { flex: 1, gap: 4 },
  waveform: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    height: 32,
  },
  bar: { width: 3, borderRadius: 2, minHeight: 4 },
  track: {
    height: 2, borderRadius: 1, overflow: 'hidden',
  },
  fill: { height: 2, borderRadius: 1 },
  duration: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});
