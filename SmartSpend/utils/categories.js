// utils/categories.js
export const CAT_META = {
  Salary:        { emoji: '💼', color: '#16A34A', bg: '#DCFCE7' },
  Bonus:         { emoji: '🏆', color: '#CA8A04', bg: '#FEF9C3' },
  Gift:          { emoji: '🎁', color: '#7C3AED', bg: '#F3E8FF' },
  Refund:        { emoji: '↩️',  color: '#2563EB', bg: '#DBEAFE' },
  Investment:    { emoji: '📈', color: '#0F766E', bg: '#CCFBF1' },
  Freelance:     { emoji: '💻', color: '#0369A1', bg: '#E0F2FE' },
  Food:          { emoji: '🍔', color: '#EA580C', bg: '#FFEDD5' },
  Transport:     { emoji: '🚇', color: '#0369A1', bg: '#E0F2FE' },
  Shopping:      { emoji: '🛍️', color: '#A21CAF', bg: '#FAE8FF' },
  Bills:         { emoji: '⚡', color: '#DC2626', bg: '#FEE2E2' },
  Health:        { emoji: '💊', color: '#BE123C', bg: '#FFE4E6' },
  Rent:          { emoji: '🏠', color: '#4F46E5', bg: '#E0E7FF' },
  Groceries:     { emoji: '🛒', color: '#15803D', bg: '#DCFCE7' },
  Dining:        { emoji: '🍽️', color: '#DB2777', bg: '#FCE7F3' },
  Entertainment: { emoji: '🎬', color: '#B45309', bg: '#FEF3C7' },
  Education:     { emoji: '📚', color: '#1D4ED8', bg: '#DBEAFE' },
  Travel:        { emoji: '✈️', color: '#0891B2', bg: '#CFFAFE' },
  Income:        { emoji: '💰', color: '#16A34A', bg: '#DCFCE7' },
  Expense:       { emoji: '📌', color: '#4B5563', bg: '#F3F4F6' },
  Other:         { emoji: '📌', color: '#4B5563', bg: '#F3F4F6' },
};

export function getCatMeta(name) {
  return CAT_META[name] || { emoji: '💳', color: '#6B7280', bg: '#F3F4F6' };
}
