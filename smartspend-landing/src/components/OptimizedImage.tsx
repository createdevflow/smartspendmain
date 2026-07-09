'use client';

import React, { useState, useEffect } from 'react';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  style?: React.CSSProperties;
  sizes?: string;
  priority?: boolean;
  blurDataURL?: string;
  fallbackText?: string;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

/**
 * Helper to check if URL is from Cashtro Media API
 */
function isMediaApiUrl(url?: string): boolean {
  if (!url) return false;
  return url.includes('/media/') || url.includes('/api/v1/media/');
}

/**
 * Helper to check if URL is from Unsplash
 */
function isUnsplashUrl(url?: string): boolean {
  if (!url) return false;
  return url.includes('images.unsplash.com');
}

/**
 * Generate srcset for a specific format (webp, avif, or original)
 */
function generateSrcSet(src?: string, format?: 'webp' | 'avif'): string | undefined {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return undefined;

  // Cashtro Media Service URL
  if (isMediaApiUrl(src)) {
    const baseUrl = src.split('?')[0];
    const fmtParam = format ? `&format=${format}` : '';
    return [
      `${baseUrl}?size=thumbnail${fmtParam} 250w`,
      `${baseUrl}?size=small${fmtParam} 500w`,
      `${baseUrl}?size=medium${fmtParam} 1000w`,
      `${baseUrl}?size=large${fmtParam} 1500w`,
      `${baseUrl}?size=original${fmtParam} 2000w`,
    ].join(', ');
  }

  // Unsplash URL
  if (isUnsplashUrl(src)) {
    const baseUrl = src.split('?')[0];
    const fmtParam = format ? `&fm=${format}` : '&auto=format';
    return [
      `${baseUrl}?w=250&q=80${fmtParam} 250w`,
      `${baseUrl}?w=500&q=80${fmtParam} 500w`,
      `${baseUrl}?w=1000&q=80${fmtParam} 1000w`,
      `${baseUrl}?w=1500&q=80${fmtParam} 1500w`,
      `${baseUrl}?w=2000&q=80${fmtParam} 2000w`,
    ].join(', ');
  }

  // Static / local images or other remote URLs
  // For standard URLs, we return undefined so browser uses standard src
  return undefined;
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  style,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
  blurDataURL,
  fallbackText = 'Image not available',
  aspectRatio,
  objectFit = 'cover',
  onLoad,
  onError,
  ...rest
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    setIsLoaded(true);
    if (onError) onError(e);
  };

  const avifSrcSet = generateSrcSet(src, 'avif');
  const webpSrcSet = generateSrcSet(src, 'webp');
  const defaultSrcSet = generateSrcSet(src);

  // Default blur shimmer background
  const shimmerStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, #F3F4F6 0%, #E5E7EB 50%, #F3F4F6 100%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  };

  if (!src || hasError) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-slate-100 text-slate-400 overflow-hidden rounded-xl p-4 ${containerClassName} ${className}`}
        style={{ aspectRatio: aspectRatio || undefined, minHeight: '120px', ...style }}
      >
        <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs text-center font-medium opacity-75">{fallbackText}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${containerClassName}`}
      style={{
        aspectRatio: aspectRatio || undefined,
        ...style,
      }}
    >
      {/* Blur / Shimmer Placeholder */}
      {!isLoaded && (
        <div
          className="absolute inset-0 z-0 transition-opacity duration-500 ease-in-out"
          style={blurDataURL ? {
            backgroundImage: `url(${blurDataURL})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(10px)',
            transform: 'scale(1.05)',
          } : shimmerStyle}
        />
      )}

      {/* Picture with responsive AVIF, WebP, and original format sources */}
      <picture className="w-full h-full block">
        {avifSrcSet && (
          <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
        )}
        {webpSrcSet && (
          <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
        )}
        {defaultSrcSet && (
          <source srcSet={defaultSrcSet} sizes={sizes} />
        )}
        <img
          src={src}
          alt={alt}
          sizes={defaultSrcSet ? sizes : undefined}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full block transition-all duration-500 ease-out ${
            !isLoaded ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          } ${className}`}
          style={{
            objectFit,
          }}
          {...rest}
        />
      </picture>
    </div>
  );
}
