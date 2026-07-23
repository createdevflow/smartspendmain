'use client';
import React from 'react';
import { Loader2 } from 'lucide-react';

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type BtnSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
  as?: 'button' | 'a';
  href?: string;
}

/**
 * DS Button:
 * Primary:     blue bg, white text, 8px radius
 * Secondary:   surface-raised bg, 1px border, text-primary
 * Ghost:       transparent, text-secondary, for toolbar/icons
 * Destructive: danger text+border; filled danger only on confirm step
 *
 * Heights: sm=28px, md=32px, lg=36px
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  children,
  disabled,
  className = '',
  as: Tag = 'button',
  href,
  ...props
}: ButtonProps) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : 'btn-md',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const isDisabled = disabled || loading;

  if (Tag === 'a') {
    return (
      <a className={classes} href={href} aria-disabled={isDisabled}>
        {loading && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
        {children}
      </a>
    );
  }

  return (
    <button className={classes} disabled={isDisabled} {...props}>
      {loading && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
