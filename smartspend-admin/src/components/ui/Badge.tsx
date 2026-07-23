import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'gray';
export type BadgeShape = 'pill' | 'badge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  shape?: BadgeShape;
  className?: string;
}

/**
 * DS Badge:
 * - shape="pill"  → 100px border-radius (status pills)
 * - shape="badge" → 4px border-radius (compact tags, default)
 * Always pair color with text label — never color alone.
 */
export function Badge({
  children,
  variant = 'gray',
  shape = 'pill',
  className = '',
}: BadgeProps) {
  const baseClass = shape === 'pill' ? 'pill' : 'badge';
  return (
    <span className={`${baseClass} ${baseClass}-${variant} ${className}`}>
      {children}
    </span>
  );
}
