'use client';
import React from 'react';

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * DS Tabs:
 * - 36px height, border-bottom indicator in brand-blue
 * - Used in Settings, Blog, Support
 */
export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={`tabs ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`tabpanel-${tab.id}`}
          id={`tab-${tab.id}`}
          onClick={() => onChange(tab.id)}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
        >
          {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
          {tab.label}
          {tab.count !== undefined && (
            <span
              className="badge badge-gray"
              style={{ marginLeft: 'var(--sp-1)' }}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
