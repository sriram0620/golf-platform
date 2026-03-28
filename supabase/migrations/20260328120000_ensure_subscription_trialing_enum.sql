-- If this migration fails, your Postgres version may require running without IF NOT EXISTS.
-- Then use: ALTER TYPE subscription_status ADD VALUE 'trialing';

ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'trialing';
