// components/chat/VoicePlayer.js
// WhatsApp-style compact voice pill with interactive smooth waveform scrubbing & live playback speed toggle
// PERF FIX: Single Animated tick drives all bars (vs 22 separate loops), durationMs in ref for stable PanResponder
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { PanResponder } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const WAVEFORM_BARS = 22;
const SPEEDS = [1.0, 1.25, 1.5, 2.0];

function generateBars() {
  return Array.from({ length: WAVEFORM_BARS }, () => 0.2 + Math.random() * 0.8);
}

function formatDuration(ms) {
  const total = Math.floor((ms || 0) / 1000);
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
  const [speedIndex, setSpeedIndex] = useState(0);
  const [bars] = useState(generateBars);

  // Keep durationMs in a ref for the PanResponder (fixes stale closure)
  const durationMsRef = useRef(durationMs);
  useEffect(() => { durationMsRef.current = durationMs; }, [durationMs]);

  const waveWidthRef = useRef(140);
  const isScrubbingRef = useRef(false);
  const isPlayingRef = useRef(false);

  // Single animation tick — drives all bars via interpolation (much lighter than 22 loops)
  const playTick = useRef(new Animated.Value(0)).current;
  const playAnimRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      isPlayingRef.current = true;
      playAnimRef.current = Animated.loop(
        Animated.timing(playTick, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      );
      playAnimRef.current.start();
    } else {
      isPlayingRef.current = false;
      playAnimRef.current?.stop();
      Animated.timing(playTick, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    }
    return () => { playAnimRef.current?.stop(); };
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const toggleSpeed = useCallback(async () => {
    const nextIdx = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(nextIdx);
    const rate = SPEEDS[nextIdx];
    if (soundRef.current) {
      try {
        await soundRef.current.setRateAsync(rate, true, Audio.PitchCorrectionQuality.High);
      } catch (e) {
        try { await soundRef.current.setRateAsync(rate, true); } catch {}
      }
    }
  }, [speedIndex]);

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

      const rate = SPEEDS[speedIndex];
      const { sound, status } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, rate, shouldCorrectPitch: true },
        (status) => {
          if (status.isLoaded) {
            if (!isScrubbingRef.current) {
              setPositionMs(status.positionMillis || 0);
            }
            if (status.durationMillis) {
              setDurationMs(status.durationMillis);
            }
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
      // Audio playback fallback — silently fail
    } finally {
      setIsLoading(false);
    }
  }, [uri, speedIndex]);

  const handlePlayPause = useCallback(async () => {
    if (isLoading) return;
    if (!soundRef.current) {
      await loadAndPlay();
      return;
    }
    const status = await soundRef.current.getStatusAsync();
    if (status.isLoaded) {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        if (status.positionMillis >= (status.durationMillis || durationMsRef.current) - 200) {
          await soundRef.current.setPositionAsync(0);
        }
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    }
  }, [isPlaying, isLoading, loadAndPlay]);

  // Stable scrub handler — reads durationMs from ref to avoid stale closure
  const handleScrub = useCallback(async (touchX) => {
    const width = waveWidthRef.current || 140;
    const pct = Math.max(0, Math.min(1, touchX / width));
    const targetMs = Math.floor(pct * (durationMsRef.current || 1000));
    setPositionMs(targetMs);
    if (soundRef.current) {
      try {
        await soundRef.current.setPositionAsync(targetMs);
      } catch (e) {}
    }
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        isScrubbingRef.current = true;
        handleScrub(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        handleScrub(evt.nativeEvent.locationX);
      },
      onPanResponderRelease: () => { isScrubbingRef.current = false; },
      onPanResponderTerminate: () => { isScrubbingRef.current = false; },
    })
  ).current;

  const progressPct = durationMs > 0 ? Math.min(positionMs / durationMs, 1) : 0;
  const activeBarIndex = Math.floor(progressPct * WAVEFORM_BARS);

  const primaryColor = isOwn ? '#FFFFFF' : '#1D4ED8';
  const inactiveColor = isOwn ? 'rgba(255,255,255,0.35)' : '#CBD5E1';

  return (
    <View style={styles.pill}>
      {/* Play / Pause button */}
      <TouchableOpacity style={[styles.playBtn, isOwn && styles.playBtnOwn]} onPress={handlePlayPause} activeOpacity={0.75}>
        <Feather
          name={isLoading ? 'loader' : isPlaying ? 'pause' : 'play'}
          size={16}
          color={isOwn ? '#1D4ED8' : '#FFFFFF'}
        />
      </TouchableOpacity>

      {/* Interactive Scrubbable Waveform container */}
      <View
        style={styles.waveformCol}
        onLayout={(e) => { waveWidthRef.current = e.nativeEvent.layout.width; }}
        {...panResponder.panHandlers}
      >
        <View style={styles.waveformRow}>
          {bars.map((barHeight, idx) => {
            const isActive = idx <= activeBarIndex;
            // Each bar gets a slight phase offset from the single tick for organic feel
            const phaseOffset = (idx / WAVEFORM_BARS) * Math.PI * 2;
            const animScale = playTick.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [
                1,
                isActive ? 0.4 + (Math.sin(phaseOffset) * 0.4 + 0.3) : 0.85,
                1,
              ],
            });
            return (
              <Animated.View
                key={idx}
                style={[
                  styles.waveBar,
                  {
                    height: Math.max(4, barHeight * 20),
                    backgroundColor: isActive ? primaryColor : inactiveColor,
                    transform: [{ scaleY: animScale }],
                  },
                ]}
              />
            );
          })}
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.durationText, { color: primaryColor }]}>
            {isPlaying ? formatDuration(positionMs) : formatDuration(durationMs)}
          </Text>
        </View>
      </View>

      {/* Live playback speed badge */}
      <TouchableOpacity style={[styles.speedBadge, isOwn && styles.speedBadgeOwn]} onPress={toggleSpeed}>
        <Text style={[styles.speedText, isOwn && styles.speedTextOwn]}>{SPEEDS[speedIndex]}x</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    minWidth: 210,
    maxWidth: 250,
    gap: 8,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnOwn: {
    backgroundColor: '#FFFFFF',
  },
  waveformCol: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
    gap: 2,
  },
  waveBar: {
    flex: 1,
    minWidth: 2,
    borderRadius: 1.5,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  durationText: {
    fontSize: 10,
    fontWeight: '600',
  },
  speedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
  },
  speedBadgeOwn: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  speedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  speedTextOwn: {
    color: '#FFFFFF',
  },
});
