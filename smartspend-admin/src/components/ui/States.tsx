import React from 'react';
import { InboxIcon } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  colSpan?: number;
}

/**
 * DS Empty State:
 * - Renders inside a table <tbody> or as standalone in a table shell
 * - Explains what is missing + offers one action
 */
export function EmptyState({
  title = 'No results',
  description = 'Nothing matches your current filters.',
  action,
  icon,
  colSpan,
}: EmptyStateProps) {
  const content = (
    <div className="state-empty">
      <div className="state-empty-icon" aria-hidden="true">
        {icon ?? <InboxIcon size={32} />}
      </div>
      <p className="state-empty-title">{title}</p>
      {description && <p className="state-empty-desc">{description}</p>}
      {action}
    </div>
  );

  if (colSpan) {
    return (
      <tr>
        <td colSpan={colSpan} style={{ padding: 0 }}>
          {content}
        </td>
      </tr>
    );
  }

  return content;
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  colSpan?: number;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Could not load this data.',
  onRetry,
  colSpan,
}: ErrorStateProps) {
  const content = (
    <div className="state-error">
      <div className="state-error-icon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4m0 4h.01" />
        </svg>
      </div>
      <p className="state-error-title">{title}</p>
      {description && <p className="state-error-desc">{description}</p>}
      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );

  if (colSpan) {
    return (
      <tr>
        <td colSpan={colSpan} style={{ padding: 0 }}>
          {content}
        </td>
      </tr>
    );
  }

  return content;
}
