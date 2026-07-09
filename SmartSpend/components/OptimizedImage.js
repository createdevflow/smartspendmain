import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import MediaCacheService from '../services/MediaCacheService';

export default function OptimizedImage({
  source,
  style,
  contentFit = 'cover',
  placeholder,
  transition = 200,
  size, // 'thumbnail' | 'medium' | 'large' | undefined
  showShimmer = true,
  fallbackIcon = 'image-outline',
  onLoad,
  onError,
  ...props
}) {
  const [resolvedUri, setResolvedUri] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const shimmerAnim = React.useRef(new Animated.Value(0.3)).current;

  // Extract URI from source object or string
  const getRawUri = () => {
    if (!source) return null;
    if (typeof source === 'string') return source;
    if (typeof source === 'object' && source.uri) return source.uri;
    return null;
  };

  // Helper to adjust URL for responsive variant if requested and hosted on our media server
  const getResponsiveUri = (uri) => {
    if (!uri || !size || typeof uri !== 'string') return uri;
    // If it's a remote URL ending with .webp/.jpg/.png and we requested a size
    if (uri.includes('/media/') && ['thumbnail', 'medium', 'large'].includes(size)) {
      const parts = uri.split('.');
      if (parts.length > 1) {
        const ext = parts.pop();
        const base = parts.join('.');
        // Avoid double suffixing if already suffixed
        if (!base.endsWith('_thumbnail') && !base.endsWith('_medium') && !base.endsWith('_large')) {
          return `${base}_${size}.${ext}`;
        }
      }
    }
    return uri;
  };

  useEffect(() => {
    let isMounted = true;
    const rawUri = getRawUri();

    if (!rawUri) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    // If it's a local require(asset) or number, use directly
    if (typeof source === 'number') {
      setResolvedUri(source);
      setIsLoading(false);
      return;
    }

    const targetUri = getResponsiveUri(rawUri);

    // Fetch from local cache or download asynchronously
    MediaCacheService.getCachedPath(targetUri)
      .then((path) => {
        if (isMounted) {
          setResolvedUri(path || targetUri);
          setHasError(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setResolvedUri(targetUri);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [source, size]);

  // Shimmer animation loop
  useEffect(() => {
    let animLoop;
    if (isLoading && showShimmer) {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 0.7,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0.3,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
      animLoop.start();
    }
    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [isLoading, showShimmer]);

  const handleLoad = (evt) => {
    setIsLoading(false);
    if (onLoad) onLoad(evt);
  };

  const handleError = (evt) => {
    setIsLoading(false);
    setHasError(true);
    if (onError) onError(evt);
  };

  if (hasError || !resolvedUri) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <Ionicons name={fallbackIcon} size={24} color="#94A3B8" />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {isLoading && showShimmer && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.shimmer,
            { opacity: shimmerAnim },
          ]}
        />
      )}
      <Image
        source={typeof resolvedUri === 'number' ? resolvedUri : { uri: resolvedUri }}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        placeholder={placeholder}
        transition={transition}
        onLoad={handleLoad}
        onError={handleError}
        cachePolicy="disk" // expo-image built-in disk caching alongside our service
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E293B', // dark slate background while loading
  },
  shimmer: {
    backgroundColor: '#334155',
  },
  fallbackContainer: {
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
