import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CACHE_DIR = (FileSystem.cacheDirectory || '') + 'media_cache/';
const METADATA_KEY = '@media_cache_metadata_v1';
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50 MB limit

class MediaCacheService {
  constructor() {
    this.metadata = {};
    this.isInitialized = false;
    this.initPromise = null;
  }

  async init() {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        if (Platform.OS !== 'web') {
          const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
          if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
          }
        }

        const storedMeta = await AsyncStorage.getItem(METADATA_KEY);
        if (storedMeta) {
          this.metadata = JSON.parse(storedMeta);
        }
        this.isInitialized = true;
      } catch (error) {
        console.warn('[MediaCache] Initialization failed, running without persistent cache:', error);
        this.metadata = {};
        this.isInitialized = true;
      }
    })();

    return this.initPromise;
  }

  // Simple string hasher for generating clean filenames from URLs
  hashUrl(url) {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || 'webp';
    const cleanExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'].includes(ext) ? ext : 'webp';
    return `media_${Math.abs(hash)}_${Date.now().toString(36)}.${cleanExt}`;
  }

  async getCachedPath(url) {
    if (!url || typeof url !== 'string') return null;

    // If already local or running on Web, return as is
    if (Platform.OS === 'web' || url.startsWith('file://') || url.startsWith('/') || url.startsWith('content://') || url.startsWith('data:')) {
      return url;
    }

    await this.init();

    try {
      // 1. Check if item exists in cache
      const cached = this.metadata[url];
      if (cached && cached.localPath) {
        const fileInfo = await FileSystem.getInfoAsync(cached.localPath);
        if (fileInfo.exists) {
          // Update lastAccessed timestamp for LRU
          cached.lastAccessed = Date.now();
          this.metadata[url] = cached;
          this.saveMetadataAsync();
          return cached.localPath;
        } else {
          // File was deleted outside our service, clean metadata
          delete this.metadata[url];
        }
      }

      // 2. Download and cache
      const filename = this.hashUrl(url);
      const targetPath = CACHE_DIR + filename;

      const downloadRes = await FileSystem.downloadAsync(url, targetPath);
      if (downloadRes && downloadRes.status === 200) {
        const fileInfo = await FileSystem.getInfoAsync(targetPath);
        const size = fileInfo.size || 0;

        // Check if eviction is needed before adding
        await this.evictLRUIfNeeded(size);

        this.metadata[url] = {
          localPath: targetPath,
          size: size,
          lastAccessed: Date.now(),
          addedAt: Date.now(),
        };

        this.saveMetadataAsync();
        return targetPath;
      }

      return url; // Fallback to remote URL if download fails
    } catch (error) {
      console.warn('[MediaCache] Error caching media URL:', url, error.message);
      return url; // Fallback to remote URL on error
    }
  }

  async evictLRUIfNeeded(incomingBytes = 0) {
    try {
      let totalSize = Object.values(this.metadata).reduce((acc, item) => acc + (item.size || 0), 0);
      if (totalSize + incomingBytes <= MAX_CACHE_SIZE) return;

      console.log(`[MediaCache] Cache limit exceeded (${Math.round(totalSize / 1024 / 1024)}MB). Evicting LRU items...`);

      // Sort items by lastAccessed ascending (oldest first)
      const entries = Object.entries(this.metadata).sort((a, b) => (a[1].lastAccessed || 0) - (b[1].lastAccessed || 0));

      for (const [url, item] of entries) {
        if (totalSize + incomingBytes <= MAX_CACHE_SIZE * 0.8) break; // Evict until 80% capacity

        try {
          await FileSystem.deleteAsync(item.localPath, { idempotent: true });
          totalSize -= (item.size || 0);
          delete this.metadata[url];
        } catch (delErr) {
          console.warn('[MediaCache] Failed to delete evicted file:', item.localPath);
        }
      }

      this.saveMetadataAsync();
    } catch (e) {
      console.error('[MediaCache] LRU eviction error:', e);
    }
  }

  saveMetadataAsync() {
    // Non-blocking async save
    AsyncStorage.setItem(METADATA_KEY, JSON.stringify(this.metadata)).catch(() => {});
  }

  async clearCache() {
    await this.init();
    try {
      if (Platform.OS !== 'web') {
        await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }
      this.metadata = {};
      await AsyncStorage.removeItem(METADATA_KEY);
      console.log('[MediaCache] Local media cache cleared.');
      return true;
    } catch (e) {
      console.error('[MediaCache] Failed to clear cache:', e);
      return false;
    }
  }

  async getCacheStats() {
    await this.init();
    const items = Object.values(this.metadata);
    const totalBytes = items.reduce((acc, item) => acc + (item.size || 0), 0);
    return {
      fileCount: items.length,
      totalSizeMB: (totalBytes / 1024 / 1024).toFixed(2),
      maxMB: MAX_CACHE_SIZE / 1024 / 1024,
    };
  }
}

export default new MediaCacheService();
