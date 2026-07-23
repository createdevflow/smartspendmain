export function fmt(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function fmtDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateShort(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return fmtDate(iso);
}

export const CAT_META: Record<string, { emoji: string; color: string; bg: string }> = {
  Salary:        { emoji: '💼', color: '#16A34A', bg: '#DCFCE7' },
  Bonus:         { emoji: '🏆', color: '#CA8A04', bg: '#FEF9C3' },
  Gift:          { emoji: '🎁', color: '#F26D21', bg: '#FFEDD5' },
  Refund:        { emoji: '↩️',  color: '#2D8CFF', bg: '#EFF6FF' },
  Investment:    { emoji: '📈', color: '#0F766E', bg: '#CCFBF1' },
  Freelance:     { emoji: '💻', color: '#0369A1', bg: '#E0F2FE' },
  Food:          { emoji: '🍔', color: '#EA580C', bg: '#FFEDD5' },
  Transport:     { emoji: '🚇', color: '#0369A1', bg: '#E0F2FE' },
  Shopping:      { emoji: '🛍️', color: '#A21CAF', bg: '#FAE8FF' },
  Bills:         { emoji: '⚡', color: '#DC2626', bg: '#FEE2E2' },
  Health:        { emoji: '💊', color: '#BE123C', bg: '#FFE4E6' },
  Rent:          { emoji: '🏠', color: '#2D8CFF', bg: '#EFF6FF' },
  Groceries:     { emoji: '🛒', color: '#15803D', bg: '#DCFCE7' },
  Dining:        { emoji: '🍽️', color: '#DB2777', bg: '#FCE7F3' },
  Entertainment: { emoji: '🎬', color: '#B45309', bg: '#FEF3C7' },
  Education:     { emoji: '📚', color: '#2D8CFF', bg: '#EFF6FF' },
  Travel:        { emoji: '✈️', color: '#0891B2', bg: '#CFFAFE' },
  Income:        { emoji: '💰', color: '#16A34A', bg: '#DCFCE7' },
  Expense:       { emoji: '📌', color: '#747487', bg: '#F3F4F6' },
  Other:         { emoji: '📌', color: '#747487', bg: '#F3F4F6' },
};

export function getCatMeta(name: string) {
  return CAT_META[name] || { emoji: '💳', color: '#747487', bg: '#F3F4F6' };
}
