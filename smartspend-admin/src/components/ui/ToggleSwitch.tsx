'use client';
import React from 'react';

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

/**
 * DS Toggle Switch:
 * 36×20px, brand-blue when checked, 100px pill radius
 * Always accessible with a visible label
 */
export function ToggleSwitch({
  id,
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 'var(--sp-4)',
      }}
    >
      {(label || description) && (
        <div style={{ flex: 1, minWidth: 0 }}>
          {label && (
            <label
              htmlFor={id}
              style={{
                display: 'block',
                fontSize: 'var(--type-body)',
                fontWeight: 500,
                color: 'var(--text-primary)',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {label}
            </label>
          )}
          {description && (
            <p
              style={{
                fontSize: 'var(--type-caption)',
                color: 'var(--text-muted)',
                marginTop: 'var(--sp-1)',
                lineHeight: 1.5,
              }}
            >
              {description}
            </p>
          )}
        </div>
      )}
      <label className="toggle" style={{ flexShrink: 0 }}>
        <input
          type="checkbox"
          id={id}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          aria-checked={checked}
        />
        <span className="toggle-slider" />
      </label>
    </div>
  );
}
