// prisma/seed.ts — Seed database with categories, keywords, default features, and Free plan
import { PrismaClient, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

const SYSTEM_CATEGORIES = [
  // ── EXPENSE ──────────────────────────────────────────────────────────────
  {
    name: 'Food & Dining', slug: 'food-dining', emoji: '🍽️',
    color: '#F97316', type: 'expense', sortOrder: 1,
    keywords: [
      { keyword: 'swiggy', priority: 10 }, { keyword: 'zomato', priority: 10 },
      { keyword: 'restaurant', priority: 8 }, { keyword: 'hotel food', priority: 8 },
      { keyword: 'café', priority: 7 }, { keyword: 'coffee', priority: 7 },
      { keyword: 'starbucks', priority: 9 }, { keyword: 'café coffee day', priority: 9 },
      { keyword: 'ccd', priority: 8 }, { keyword: 'dominos', priority: 9 },
      { keyword: 'pizza', priority: 7 }, { keyword: 'burger', priority: 7 },
      { keyword: 'mcdonalds', priority: 9 }, { keyword: 'kfc', priority: 9 },
      { keyword: 'subway', priority: 9 }, { keyword: 'biryani', priority: 7 },
      { keyword: 'dhaba', priority: 7 }, { keyword: 'thali', priority: 6 },
      { keyword: 'food', priority: 5 }, { keyword: 'lunch', priority: 5 },
      { keyword: 'dinner', priority: 5 }, { keyword: 'breakfast', priority: 5 },
      { keyword: 'snacks', priority: 5 }, { keyword: 'maggi', priority: 6 },
      { keyword: 'dunzo food', priority: 8 }, { keyword: 'eatsure', priority: 8 },
    ],
  },
  {
    name: 'Groceries', slug: 'groceries', emoji: '🛒',
    color: '#22C55E', type: 'expense', sortOrder: 2,
    keywords: [
      { keyword: 'blinkit', priority: 10 }, { keyword: 'zepto', priority: 10 },
      { keyword: 'bigbasket', priority: 10 }, { keyword: 'big basket', priority: 10 },
      { keyword: 'dmart', priority: 9 }, { keyword: 'd mart', priority: 9 },
      { keyword: 'reliance fresh', priority: 9 }, { keyword: 'reliance smart', priority: 9 },
      { keyword: 'more supermarket', priority: 9 }, { keyword: 'grofers', priority: 9 },
      { keyword: 'jiomart', priority: 9 }, { keyword: 'supermarket', priority: 6 },
      { keyword: 'grocery', priority: 7 }, { keyword: 'vegetables', priority: 6 },
      { keyword: 'fruits', priority: 6 }, { keyword: 'milk', priority: 6 },
      { keyword: 'dairy', priority: 6 }, { keyword: 'ration', priority: 7 },
      { keyword: 'sabzi', priority: 7 }, { keyword: 'kirana', priority: 8 },
    ],
  },
  {
    name: 'Transport', slug: 'transport', emoji: '🚗',
    color: '#3B82F6', type: 'expense', sortOrder: 3,
    keywords: [
      { keyword: 'uber', priority: 10 }, { keyword: 'ola', priority: 10 },
      { keyword: 'rapido', priority: 10 }, { keyword: 'auto', priority: 7 },
      { keyword: 'taxi', priority: 7 }, { keyword: 'cab', priority: 7 },
      { keyword: 'petrol', priority: 9 }, { keyword: 'diesel', priority: 9 },
      { keyword: 'fuel', priority: 8 }, { keyword: 'hp petrol', priority: 9 },
      { keyword: 'iocl', priority: 9 }, { keyword: 'indian oil', priority: 9 },
      { keyword: 'bharat petroleum', priority: 9 }, { keyword: 'metro', priority: 8 },
      { keyword: 'dmrc', priority: 9 }, { keyword: 'bus', priority: 6 },
      { keyword: 'irctc', priority: 9 }, { keyword: 'train ticket', priority: 8 },
      { keyword: 'railway', priority: 8 }, { keyword: 'parking', priority: 7 },
      { keyword: 'toll', priority: 8 }, { keyword: 'fastag', priority: 9 },
      { keyword: 'bluedart courier', priority: 7 }, { keyword: 'bike service', priority: 7 },
    ],
  },
  {
    name: 'Shopping', slug: 'shopping', emoji: '🛍️',
    color: '#EC4899', type: 'expense', sortOrder: 4,
    keywords: [
      { keyword: 'amazon', priority: 10 }, { keyword: 'flipkart', priority: 10 },
      { keyword: 'myntra', priority: 10 }, { keyword: 'ajio', priority: 10 },
      { keyword: 'nykaa', priority: 9 }, { keyword: 'meesho', priority: 9 },
      { keyword: 'snapdeal', priority: 9 }, { keyword: 'tatacliq', priority: 9 },
      { keyword: 'croma', priority: 9 }, { keyword: 'reliance digital', priority: 9 },
      { keyword: 'vijay sales', priority: 9 }, { keyword: 'clothing', priority: 6 },
      { keyword: 'shoes', priority: 6 }, { keyword: 'fashion', priority: 5 },
      { keyword: 'mall', priority: 6 }, { keyword: 'garments', priority: 6 },
      { keyword: 'westside', priority: 8 }, { keyword: 'h&m', priority: 8 },
      { keyword: 'zara', priority: 8 }, { keyword: 'max fashion', priority: 8 },
    ],
  },
  {
    name: 'Entertainment', slug: 'entertainment', emoji: '🎬',
    color: '#8B5CF6', type: 'expense', sortOrder: 5,
    keywords: [
      { keyword: 'netflix', priority: 10 }, { keyword: 'amazon prime', priority: 10 },
      { keyword: 'hotstar', priority: 10 }, { keyword: 'disney+', priority: 10 },
      { keyword: 'sony liv', priority: 10 }, { keyword: 'zee5', priority: 10 },
      { keyword: 'jiocinema', priority: 10 }, { keyword: 'spotify', priority: 10 },
      { keyword: 'gaana', priority: 9 }, { keyword: 'jiosaavn', priority: 9 },
      { keyword: 'youtube premium', priority: 9 }, { keyword: 'movie', priority: 7 },
      { keyword: 'cinema', priority: 7 }, { keyword: 'pvr', priority: 9 },
      { keyword: 'inox', priority: 9 }, { keyword: 'bookmyshow', priority: 9 },
      { keyword: 'game', priority: 6 }, { keyword: 'steam', priority: 8 },
      { keyword: 'pubg', priority: 7 }, { keyword: 'gaming', priority: 7 },
    ],
  },
  {
    name: 'Bills & Utilities', slug: 'bills-utilities', emoji: '💡',
    color: '#F59E0B', type: 'expense', sortOrder: 6,
    keywords: [
      { keyword: 'electricity', priority: 9 }, { keyword: 'water bill', priority: 9 },
      { keyword: 'gas bill', priority: 9 }, { keyword: 'internet', priority: 8 },
      { keyword: 'broadband', priority: 8 }, { keyword: 'airtel', priority: 8 },
      { keyword: 'jio', priority: 8 }, { keyword: 'bsnl', priority: 8 },
      { keyword: 'vi ', priority: 7 }, { keyword: 'vodafone', priority: 8 },
      { keyword: 'mobile recharge', priority: 8 }, { keyword: 'dth', priority: 7 },
      { keyword: 'tata sky', priority: 8 }, { keyword: 'dish tv', priority: 8 },
      { keyword: 'maintenance', priority: 6 }, { keyword: 'society', priority: 6 },
      { keyword: 'lpg', priority: 8 }, { keyword: 'gas cylinder', priority: 8 },
      { keyword: 'indane', priority: 8 }, { keyword: 'hp gas', priority: 8 },
    ],
  },
  {
    name: 'Health & Medical', slug: 'health-medical', emoji: '💊',
    color: '#EF4444', type: 'expense', sortOrder: 7,
    keywords: [
      { keyword: 'pharmacy', priority: 9 }, { keyword: 'hospital', priority: 9 },
      { keyword: 'clinic', priority: 8 }, { keyword: 'doctor', priority: 8 },
      { keyword: 'medicine', priority: 8 }, { keyword: 'apollo pharmacy', priority: 10 },
      { keyword: 'medplus', priority: 10 }, { keyword: 'netmeds', priority: 10 },
      { keyword: '1mg', priority: 10 }, { keyword: 'practo', priority: 9 },
      { keyword: 'pathlab', priority: 8 }, { keyword: 'diagnostic', priority: 8 },
      { keyword: 'dental', priority: 7 }, { keyword: 'optician', priority: 7 },
      { keyword: 'gym', priority: 8 }, { keyword: 'fitness', priority: 7 },
      { keyword: 'cult fit', priority: 9 }, { keyword: 'physiotherapy', priority: 7 },
    ],
  },
  {
    name: 'Education', slug: 'education', emoji: '📚',
    color: '#06B6D4', type: 'expense', sortOrder: 8,
    keywords: [
      { keyword: 'school fee', priority: 9 }, { keyword: 'college fee', priority: 9 },
      { keyword: 'tuition', priority: 8 }, { keyword: 'udemy', priority: 9 },
      { keyword: 'coursera', priority: 9 }, { keyword: 'unacademy', priority: 9 },
      { keyword: 'byju', priority: 9 }, { keyword: 'vedantu', priority: 9 },
      { keyword: 'books', priority: 7 }, { keyword: 'stationery', priority: 7 },
      { keyword: 'exam fee', priority: 8 }, { keyword: 'course', priority: 6 },
    ],
  },
  {
    name: 'Home & Rent', slug: 'home-rent', emoji: '🏠',
    color: '#84CC16', type: 'expense', sortOrder: 9,
    keywords: [
      { keyword: 'rent', priority: 9 }, { keyword: 'landlord', priority: 8 },
      { keyword: 'furniture', priority: 7 }, { keyword: 'ikea', priority: 9 },
      { keyword: 'urban ladder', priority: 9 }, { keyword: 'pepperfry', priority: 9 },
      { keyword: 'home decor', priority: 7 }, { keyword: 'repair', priority: 6 },
      { keyword: 'plumber', priority: 7 }, { keyword: 'electrician', priority: 7 },
      { keyword: 'carpenter', priority: 7 }, { keyword: 'housekeeping', priority: 7 },
      { keyword: 'maid', priority: 7 }, { keyword: 'bai', priority: 6 },
    ],
  },
  {
    name: 'Personal Care', slug: 'personal-care', emoji: '💆',
    color: '#F43F5E', type: 'expense', sortOrder: 10,
    keywords: [
      { keyword: 'salon', priority: 9 }, { keyword: 'parlour', priority: 9 },
      { keyword: 'barber', priority: 8 }, { keyword: 'haircut', priority: 8 },
      { keyword: 'spa', priority: 8 }, { keyword: 'beauty', priority: 7 },
      { keyword: 'nykaa beauty', priority: 9 }, { keyword: 'loreal', priority: 8 },
      { keyword: 'mamaearth', priority: 8 }, { keyword: 'skincare', priority: 6 },
    ],
  },
  {
    name: 'Travel', slug: 'travel', emoji: '✈️',
    color: '#0EA5E9', type: 'expense', sortOrder: 11,
    keywords: [
      { keyword: 'oyo', priority: 9 }, { keyword: 'makemytrip', priority: 10 },
      { keyword: 'goibibo', priority: 10 }, { keyword: 'yatra', priority: 9 },
      { keyword: 'airbnb', priority: 9 }, { keyword: 'hotel booking', priority: 8 },
      { keyword: 'flight', priority: 8 }, { keyword: 'indigo', priority: 8 },
      { keyword: 'air india', priority: 8 }, { keyword: 'spicejet', priority: 8 },
      { keyword: 'vistara', priority: 8 }, { keyword: 'trip', priority: 6 },
      { keyword: 'tour package', priority: 8 }, { keyword: 'resort', priority: 7 },
    ],
  },
  {
    name: 'Finance & Insurance', slug: 'finance-insurance', emoji: '🏦',
    color: '#6366F1', type: 'expense', sortOrder: 12,
    keywords: [
      { keyword: 'insurance premium', priority: 9 }, { keyword: 'lic premium', priority: 10 },
      { keyword: 'emi', priority: 9 }, { keyword: 'loan emi', priority: 9 },
      { keyword: 'credit card bill', priority: 9 }, { keyword: 'bank charge', priority: 8 },
      { keyword: 'mutual fund', priority: 8 }, { keyword: 'sip', priority: 9 },
      { keyword: 'stock purchase', priority: 7 }, { keyword: 'zerodha', priority: 8 },
      { keyword: 'groww', priority: 8 }, { keyword: 'upstox', priority: 8 },
    ],
  },
  {
    name: 'Gifts & Donations', slug: 'gifts-donations', emoji: '🎁',
    color: '#A855F7', type: 'expense', sortOrder: 13,
    keywords: [
      { keyword: 'gift', priority: 7 }, { keyword: 'donation', priority: 8 },
      { keyword: 'charity', priority: 8 }, { keyword: 'temple', priority: 6 },
      { keyword: 'ngo', priority: 7 }, { keyword: 'birthday gift', priority: 8 },
    ],
  },
  {
    name: 'Taxes', slug: 'taxes', emoji: '📋',
    color: '#64748B', type: 'expense', sortOrder: 14,
    keywords: [
      { keyword: 'income tax', priority: 10 }, { keyword: 'tds', priority: 9 },
      { keyword: 'advance tax', priority: 9 }, { keyword: 'gst payment', priority: 9 },
      { keyword: 'challan', priority: 8 }, { keyword: 'e-filing', priority: 8 },
    ],
  },
  {
    name: 'Business Expense', slug: 'business-expense', emoji: '💼',
    color: '#475569', type: 'expense', sortOrder: 15,
    keywords: [
      { keyword: 'office supplies', priority: 8 }, { keyword: 'vendor payment', priority: 7 },
      { keyword: 'professional fee', priority: 7 }, { keyword: 'courier', priority: 6 },
      { keyword: 'printing', priority: 6 }, { keyword: 'business travel', priority: 7 },
    ],
  },
  {
    name: 'Other Expense', slug: 'other-expense', emoji: '📦',
    color: '#94A3B8', type: 'expense', sortOrder: 99,
    keywords: [],
  },

  // ── INCOME ───────────────────────────────────────────────────────────────
  {
    name: 'Salary', slug: 'salary', emoji: '💰',
    color: '#10B981', type: 'income', sortOrder: 1,
    keywords: [
      { keyword: 'salary', priority: 10 }, { keyword: 'payroll', priority: 10 },
      { keyword: 'wages', priority: 9 }, { keyword: 'stipend', priority: 9 },
      { keyword: 'monthly salary', priority: 10 }, { keyword: 'pay credit', priority: 9 },
    ],
  },
  {
    name: 'Freelance', slug: 'freelance', emoji: '💻',
    color: '#3B82F6', type: 'income', sortOrder: 2,
    keywords: [
      { keyword: 'freelance', priority: 10 }, { keyword: 'project payment', priority: 9 },
      { keyword: 'client payment', priority: 8 }, { keyword: 'upwork', priority: 9 },
      { keyword: 'fiverr', priority: 9 }, { keyword: 'consulting', priority: 8 },
      { keyword: 'gig payment', priority: 8 },
    ],
  },
  {
    name: 'Business Income', slug: 'business-income', emoji: '🏢',
    color: '#8B5CF6', type: 'income', sortOrder: 3,
    keywords: [
      { keyword: 'sales revenue', priority: 9 }, { keyword: 'business profit', priority: 8 },
      { keyword: 'invoice payment', priority: 8 }, { keyword: 'payment received', priority: 7 },
    ],
  },
  {
    name: 'Investment Returns', slug: 'investment-returns', emoji: '📈',
    color: '#22C55E', type: 'income', sortOrder: 4,
    keywords: [
      { keyword: 'dividend', priority: 10 }, { keyword: 'interest income', priority: 9 },
      { keyword: 'capital gain', priority: 9 }, { keyword: 'fd interest', priority: 9 },
      { keyword: 'mutual fund return', priority: 9 }, { keyword: 'stock profit', priority: 8 },
    ],
  },
  {
    name: 'Rental Income', slug: 'rental-income', emoji: '🏘️',
    color: '#F59E0B', type: 'income', sortOrder: 5,
    keywords: [
      { keyword: 'rent received', priority: 10 }, { keyword: 'rental income', priority: 10 },
      { keyword: 'tenant payment', priority: 9 },
    ],
  },
  {
    name: 'Refund', slug: 'refund', emoji: '↩️',
    color: '#06B6D4', type: 'income', sortOrder: 6,
    keywords: [
      { keyword: 'refund', priority: 10 }, { keyword: 'cashback', priority: 10 },
      { keyword: 'return credit', priority: 9 }, { keyword: 'reimbursement', priority: 9 },
      { keyword: 'reversal', priority: 8 },
    ],
  },
  {
    name: 'Gift Received', slug: 'gift-received', emoji: '🎀',
    color: '#EC4899', type: 'income', sortOrder: 7,
    keywords: [
      { keyword: 'gift money', priority: 8 }, { keyword: 'bonus', priority: 8 },
      { keyword: 'reward', priority: 7 }, { keyword: 'prize', priority: 8 },
    ],
  },
  {
    name: 'Other Income', slug: 'other-income', emoji: '💵',
    color: '#94A3B8', type: 'income', sortOrder: 99,
    keywords: [],
  },
];

// ─── FEATURES ────────────────────────────────────────────────────────────────

const FEATURES = [
  { key: 'max_cashbooks',            name: 'Max Cashbooks',              type: 'number',  defaultValue: '99',     unit: 'cashbooks',  category: 'storage',   sortOrder: 1 },
  { key: 'max_transactions_monthly', name: 'Monthly Transactions',       type: 'number',  defaultValue: '200',   unit: 'per month',  category: 'storage',   sortOrder: 2 },
  { key: 'pdf_export',               name: 'PDF Export',                 type: 'boolean', defaultValue: 'false', category: 'export',    sortOrder: 3 },
  { key: 'csv_export',               name: 'CSV Export',                 type: 'boolean', defaultValue: 'false', category: 'export',    sortOrder: 4 },
  { key: 'excel_export',             name: 'Excel Export',               type: 'boolean', defaultValue: 'false', category: 'export',    sortOrder: 5 },
  { key: 'feature_export',           name: 'Export Features',            type: 'boolean', defaultValue: 'true',  category: 'export',    sortOrder: 6 },
  { key: 'receipt_upload',           name: 'Receipt Upload',             type: 'boolean', defaultValue: 'false', category: 'storage',   sortOrder: 6 },
  { key: 'multi_currency',           name: 'Multi-Currency',             type: 'boolean', defaultValue: 'true',  category: 'finance',   sortOrder: 7 },
  { key: 'advanced_analytics',       name: 'Advanced Analytics',         type: 'boolean', defaultValue: 'false', category: 'analytics', sortOrder: 8 },
  { key: 'recurring_transactions',   name: 'Recurring Transactions',     type: 'boolean', defaultValue: 'false', category: 'finance',   sortOrder: 9 },
  { key: 'goal_tracking',            name: 'Goal Tracking',              type: 'boolean', defaultValue: 'true',  category: 'finance',   sortOrder: 10 },
  { key: 'budget_alerts',            name: 'Budget Alerts',              type: 'boolean', defaultValue: 'true',  category: 'finance',   sortOrder: 11 },
  { key: 'transaction_splits',       name: 'Split Transactions',         type: 'boolean', defaultValue: 'false', category: 'finance',   sortOrder: 12 },
  { key: 'custom_categories',        name: 'Custom Categories',          type: 'boolean', defaultValue: 'true',  category: 'finance',   sortOrder: 13 },
  { key: 'data_backup',              name: 'Cloud Backup',               type: 'boolean', defaultValue: 'true',  category: 'security',  sortOrder: 14 },
  { key: 'priority_support',         name: 'Priority Support',           type: 'boolean', defaultValue: 'false', category: 'security',  sortOrder: 15 },
  { key: 'api_access',               name: 'API Access',                 type: 'boolean', defaultValue: 'false', category: 'security',  sortOrder: 16 },
  { key: 'feature_gallery',          name: 'Gallery Attachments',        type: 'boolean', defaultValue: 'true',  category: 'storage',   sortOrder: 17 },
];

// ─── FREE PLAN ────────────────────────────────────────────────────────────────

const FREE_PLAN = {
  name: 'Free', slug: 'free', isDefault: true, isActive: true, sortOrder: 0,
  description: 'Perfect for personal use',
  tagline: 'Start tracking your finances for free',
  color: '#64748B',
  features: {
    max_cashbooks:            '99',
    max_transactions_monthly: '200',
    pdf_export:               'false',
    csv_export:               'false',
    excel_export:             'false',
    feature_export:           'false',
    receipt_upload:           'false',
    multi_currency:           'true',
    advanced_analytics:       'false',
    recurring_transactions:   'false',
    goal_tracking:            'true',
    budget_alerts:            'true',
    transaction_splits:       'false',
    custom_categories:        'true',
    data_backup:              'true',
    priority_support:         'false',
    api_access:               'false',
    feature_gallery:          'true',
  },
};

// ─── PRO PLAN ────────────────────────────────────────────────────────────────

const PRO_PLAN = {
  name: 'Pro', slug: 'pro', isDefault: false, isActive: true, sortOrder: 1,
  description: 'Advanced features for power users',
  tagline: 'Take full control of your finances',
  color: '#3B82F6',
  priceWeekly: 49,
  priceMonthly: 199,
  priceYearly: 1990,
  features: {
    max_cashbooks:            '999',
    max_transactions_monthly: '9999',
    pdf_export:               'true',
    csv_export:               'true',
    excel_export:             'true',
    feature_export:           'true',
    receipt_upload:           'true',
    multi_currency:           'true',
    advanced_analytics:       'true',
    recurring_transactions:   'true',
    goal_tracking:            'true',
    budget_alerts:            'true',
    transaction_splits:       'true',
    custom_categories:        'true',
    data_backup:              'true',
    priority_support:         'true',
    api_access:               'false',
    feature_gallery:          'true',
  },
};

// ─── BUSINESS PLAN ─────────────────────────────────────────────────────────────

const BUSINESS_PLAN = {
  name: 'Business', slug: 'business', isDefault: false, isActive: true, sortOrder: 2,
  description: 'For small businesses and teams',
  tagline: 'Complete finance toolkit for your business',
  color: '#8B5CF6',
  priceWeekly: 149,
  priceMonthly: 499,
  priceYearly: 4990,
  features: {
    max_cashbooks:            '999',
    max_transactions_monthly: '99999',
    pdf_export:               'true',
    csv_export:               'true',
    excel_export:             'true',
    feature_export:           'true',
    receipt_upload:           'true',
    multi_currency:           'true',
    advanced_analytics:       'true',
    recurring_transactions:   'true',
    goal_tracking:            'true',
    budget_alerts:            'true',
    transaction_splits:       'true',
    custom_categories:        'true',
    data_backup:              'true',
    priority_support:         'true',
    api_access:               'true',
    feature_gallery:          'true',
  },
};

// ─── APP CONFIG DEFAULTS ──────────────────────────────────────────────────────

const APP_CONFIGS = [
  { key: 'app_name',             value: 'SmartSpend',           description: 'Application name', isPublic: true },
  { key: 'app_version',          value: '2.0.0',                description: 'Current app version', isPublic: true },
  { key: 'maintenance_mode',     value: 'false',                description: 'Disable all user access when true', isPublic: true },
  { key: 'maintenance_message',  value: 'Down for maintenance', description: 'Message shown during maintenance', isPublic: true },
  { key: 'default_currency',     value: 'INR',                  description: 'Default currency for new users', isPublic: true },
  { key: 'supported_currencies', value: 'INR,USD,EUR,GBP,AUD,CAD,SGD,AED,SAR,JPY,CHF,HKD,CNY,KRW,MXN,BRL,ZAR,THB,MYR,IDR,PHP,NZD,SEK,NOK,DKK,PLN,TRY,ILS,CZK,HUF,RON', description: 'Comma-separated currency codes', isPublic: true },
  { key: 'otp_expiry_minutes',   value: '10',                   description: 'OTP validity in minutes', isPublic: false },
  { key: 'max_upload_size_mb',   value: '10',                   description: 'Maximum receipt upload size', isPublic: true },
  { key: 'receipt_allowed_types',value: 'image/jpeg,image/png,image/webp,application/pdf', description: 'Allowed MIME types for receipts', isPublic: true },
  { key: 'free_trial_days',      value: '7',                    description: 'Number of days for free trial', isPublic: true },
];

// ─── SEED FUNCTION ────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed App Config
  console.log('  📋 Seeding app config...');
  for (const config of APP_CONFIGS) {
    await prisma.appConfig.upsert({
      where: { key: config.key },
      create: config,
      update: { value: config.value, description: config.description },
    });
  }

  // 2. Seed Features
  console.log('  ⚙️  Seeding features...');
  for (const feature of FEATURES) {
    await prisma.feature.upsert({
      where: { key: feature.key },
      create: feature,
      update: { name: feature.name, defaultValue: feature.defaultValue },
    });
  }

  // 3. Seed Free Plan
  console.log('  📦 Seeding Free plan...');
  const freePlan = await prisma.plan.upsert({
    where: { slug: FREE_PLAN.slug },
    create: {
      name:        FREE_PLAN.name,
      slug:        FREE_PLAN.slug,
      isDefault:   FREE_PLAN.isDefault,
      isActive:    FREE_PLAN.isActive,
      sortOrder:   FREE_PLAN.sortOrder,
      description: FREE_PLAN.description,
      tagline:     FREE_PLAN.tagline,
      color:       FREE_PLAN.color,
    },
    update: { isDefault: FREE_PLAN.isDefault, isActive: FREE_PLAN.isActive },
  });

  // Assign features to free plan
  for (const [key, value] of Object.entries(FREE_PLAN.features)) {
    const feature = await prisma.feature.findUnique({ where: { key } });
    if (!feature) continue;
    await prisma.planFeature.upsert({
      where: { planId_featureId: { planId: freePlan.id, featureId: feature.id } },
      create: { planId: freePlan.id, featureId: feature.id, value },
      update: { value },
    });
  }

  // Seed Pro Plan
  console.log('  📦 Seeding Pro plan...');
  const proPlan = await prisma.plan.upsert({
    where: { slug: PRO_PLAN.slug },
    create: {
      name:        PRO_PLAN.name,
      slug:        PRO_PLAN.slug,
      isDefault:   PRO_PLAN.isDefault,
      isActive:    PRO_PLAN.isActive,
      sortOrder:   PRO_PLAN.sortOrder,
      description: PRO_PLAN.description,
      tagline:     PRO_PLAN.tagline,
      color:       PRO_PLAN.color,
      priceWeekly:  PRO_PLAN.priceWeekly,
      priceMonthly: PRO_PLAN.priceMonthly,
      priceYearly:  PRO_PLAN.priceYearly,
    },
    update: { isDefault: PRO_PLAN.isDefault, isActive: PRO_PLAN.isActive, priceWeekly: PRO_PLAN.priceWeekly, priceMonthly: PRO_PLAN.priceMonthly, priceYearly: PRO_PLAN.priceYearly },
  });

  for (const [key, value] of Object.entries(PRO_PLAN.features)) {
    const feature = await prisma.feature.findUnique({ where: { key } });
    if (!feature) continue;
    await prisma.planFeature.upsert({
      where: { planId_featureId: { planId: proPlan.id, featureId: feature.id } },
      create: { planId: proPlan.id, featureId: feature.id, value },
      update: { value },
    });
  }

  // Seed Business Plan
  console.log('  📦 Seeding Business plan...');
  const businessPlan = await prisma.plan.upsert({
    where: { slug: BUSINESS_PLAN.slug },
    create: {
      name:        BUSINESS_PLAN.name,
      slug:        BUSINESS_PLAN.slug,
      isDefault:   BUSINESS_PLAN.isDefault,
      isActive:    BUSINESS_PLAN.isActive,
      sortOrder:   BUSINESS_PLAN.sortOrder,
      description: BUSINESS_PLAN.description,
      tagline:     BUSINESS_PLAN.tagline,
      color:       BUSINESS_PLAN.color,
      priceWeekly:  BUSINESS_PLAN.priceWeekly,
      priceMonthly: BUSINESS_PLAN.priceMonthly,
      priceYearly:  BUSINESS_PLAN.priceYearly,
    },
    update: { isDefault: BUSINESS_PLAN.isDefault, isActive: BUSINESS_PLAN.isActive, priceWeekly: BUSINESS_PLAN.priceWeekly, priceMonthly: BUSINESS_PLAN.priceMonthly, priceYearly: BUSINESS_PLAN.priceYearly },
  });

  for (const [key, value] of Object.entries(BUSINESS_PLAN.features)) {
    const feature = await prisma.feature.findUnique({ where: { key } });
    if (!feature) continue;
    await prisma.planFeature.upsert({
      where: { planId_featureId: { planId: businessPlan.id, featureId: feature.id } },
      create: { planId: businessPlan.id, featureId: feature.id, value },
      update: { value },
    });
  }

  // 4. Seed System Categories + Keywords
  console.log('  🏷️  Seeding categories and keywords...');
  for (const cat of SYSTEM_CATEGORIES) {
    const { keywords, ...catData } = cat;
    const existing = await prisma.category.findFirst({ where: { slug: cat.slug, userId: null } });
    let category;
    if (existing) {
      category = await prisma.category.update({
        where: { id: existing.id },
        data: { name: cat.name, emoji: cat.emoji, color: cat.color },
      });
    } else {
      category = await prisma.category.create({
        data: { ...catData, isSystem: true, userId: null },
      });
    }

    // Seed keywords
    for (const kw of keywords) {
      const existing = await prisma.categoryKeyword.findFirst({
        where: { categoryId: category.id, keyword: kw.keyword },
      });
      if (!existing) {
        await prisma.categoryKeyword.create({
          data: { categoryId: category.id, ...kw },
        });
      }
    }
  }

  console.log('✅ Database seeded successfully!');
  console.log(`   - ${APP_CONFIGS.length} app configs`);
  console.log(`   - ${FEATURES.length} features`);
  console.log(`   - 1 plan (Free)`);
  console.log(`   - ${SYSTEM_CATEGORIES.length} categories`);
  const kwCount = SYSTEM_CATEGORIES.reduce((sum, c) => sum + c.keywords.length, 0);
  console.log(`   - ${kwCount} categorization keywords`);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
