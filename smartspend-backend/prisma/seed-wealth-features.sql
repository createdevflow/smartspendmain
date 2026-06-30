INSERT INTO "Feature" (id, key, name, description, type, "defaultValue", unit, category, "isVisible", "sortOrder", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'feature_wealth',   'Wealth Hub',         'Access to Wealth Hub module',                'boolean', 'true', NULL,     'wealth', true, 50, NOW(), NOW()),
  (gen_random_uuid()::text, 'wealth_gold',      'Gold & Metals',      'Gold, Silver, Platinum live rates',          'boolean', 'true', NULL,     'wealth', true, 51, NOW(), NOW()),
  (gen_random_uuid()::text, 'wealth_crypto',    'Crypto Markets',     'Cryptocurrency prices and watchlist',        'boolean', 'true', NULL,     'wealth', true, 52, NOW(), NOW()),
  (gen_random_uuid()::text, 'wealth_stocks',    'Stocks & Indices',   'NSE/BSE/NASDAQ indices and stock search',   'boolean', 'true', NULL,     'wealth', true, 53, NOW(), NOW()),
  (gen_random_uuid()::text, 'wealth_forex',     'Forex Rates',        'Live currency exchange rates',               'boolean', 'true', NULL,     'wealth', true, 54, NOW(), NOW()),
  (gen_random_uuid()::text, 'wealth_mf',        'Mutual Funds',       'AMFI India NAV data and SIP tracker',       'boolean', 'true', NULL,     'wealth', true, 55, NOW(), NOW()),
  (gen_random_uuid()::text, 'wealth_portfolio', 'Portfolio Tracker',  'Track investments with P&L calculations',   'boolean', 'true', NULL,     'wealth', true, 56, NOW(), NOW()),
  (gen_random_uuid()::text, 'wealth_ai',        'AI Market Insights', 'Rule-based market insights and analysis',   'boolean', 'true', NULL,     'wealth', true, 57, NOW(), NOW()),
  (gen_random_uuid()::text, 'wealth_alerts',    'Price Alerts',       'Price alerts for any tracked asset',        'number',  '5',    'alerts', 'wealth', true, 58, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;
