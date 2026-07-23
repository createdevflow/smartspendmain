'use client';
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  /** Icon to show inside input (left side) */
  iconLeft?: React.ReactNode;
  /** Icon/button to show inside input (right side) */
  iconRight?: React.ReactNode;
  wrapperStyle?: React.CSSProperties;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
  error?: string;
  wrapperStyle?: React.CSSProperties;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helper?: string;
  error?: string;
  wrapperStyle?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * DS Input:
 * - Surface Raised background, 1px Border, 8px radius, 32px height
 * - Focus: blue border + focus ring
 * - Error: Danger border + helper text below
 */
export function Input({
  label,
  helper,
  error,
  iconLeft,
  iconRight,
  wrapperStyle,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const hasError = Boolean(error);

  return (
    <div className="input-group" style={{ marginBottom: 0, ...wrapperStyle }}>
      {label && (
        <label className="input-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {iconLeft && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 'var(--sp-3)',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              display: 'flex',
              pointerEvents: 'none',
            }}
          >
            {iconLeft}
          </span>
        )}
        <input
          id={inputId}
          className={`input-field ${hasError ? 'error' : ''} ${className}`}
          aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
          aria-invalid={hasError || undefined}
          style={{
            paddingLeft: iconLeft ? 'calc(var(--sp-3) + 20px + var(--sp-1))' : undefined,
            paddingRight: iconRight ? 'calc(var(--sp-3) + 20px + var(--sp-1))' : undefined,
          }}
          {...props}
        />
        {iconRight && (
          <span
            style={{
              position: 'absolute',
              right: 'var(--sp-3)',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              display: 'flex',
            }}
          >
            {iconRight}
          </span>
        )}
      </div>
      {error && (
        <span
          id={`${inputId}-error`}
          className="input-helper error"
          role="alert"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)' }}
        >
          <AlertCircle size={11} aria-hidden="true" />
          {error}
        </span>
      )}
      {helper && !error && (
        <span id={`${inputId}-helper`} className="input-helper">
          {helper}
        </span>
      )}
    </div>
  );
}

export function Textarea({ label, helper, error, wrapperStyle, className = '', id, ...props }: TextareaProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const hasError = Boolean(error);

  return (
    <div className="input-group" style={{ marginBottom: 0, ...wrapperStyle }}>
      {label && <label className="input-label" htmlFor={inputId}>{label}</label>}
      <textarea
        id={inputId}
        className={`input-field ${hasError ? 'error' : ''} ${className}`}
        aria-invalid={hasError || undefined}
        {...props}
      />
      {error && <span className="input-helper error" role="alert">{error}</span>}
      {helper && !error && <span className="input-helper">{helper}</span>}
    </div>
  );
}

export function Select({ label, helper, error, wrapperStyle, className = '', id, children, ...props }: SelectProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const hasError = Boolean(error);

  return (
    <div className="input-group" style={{ marginBottom: 0, ...wrapperStyle }}>
      {label && <label className="input-label" htmlFor={inputId}>{label}</label>}
      <select
        id={inputId}
        className={`input-field ${hasError ? 'error' : ''} ${className}`}
        aria-invalid={hasError || undefined}
        {...props}
      >
        {children}
      </select>
      {error && <span className="input-helper error" role="alert">{error}</span>}
      {helper && !error && <span className="input-helper">{helper}</span>}
    </div>
  );
}
