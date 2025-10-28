/*
  # Add RevenueCat support for iOS subscriptions

  1. New Tables:
    - `revenuecat_subscriptions` - Track RevenueCat subscription data
    - `revenuecat_products` - Store RevenueCat product configurations
    - `revenuecat_entitlements` - Map RevenueCat entitlements to app features

  2. Updates to existing tables:
    - Add RevenueCat fields to users table
    - Add RevenueCat fields to user_subscriptions table

  3. Functions:
    - RevenueCat webhook handler
    - Subscription status sync between Stripe and RevenueCat
*/

-- Add RevenueCat fields to users table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'revenuecat_user_id') THEN
        ALTER TABLE users ADD COLUMN revenuecat_user_id text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'revenuecat_original_app_user_id') THEN
        ALTER TABLE users ADD COLUMN revenuecat_original_app_user_id text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'revenuecat_platform') THEN
        ALTER TABLE users ADD COLUMN revenuecat_platform text DEFAULT 'web';
    END IF;
END $$;

-- Add RevenueCat fields to user_subscriptions table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'revenuecat_subscription_id') THEN
        ALTER TABLE user_subscriptions ADD COLUMN revenuecat_subscription_id text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'revenuecat_product_id') THEN
        ALTER TABLE user_subscriptions ADD COLUMN revenuecat_product_id text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'revenuecat_entitlement_id') THEN
        ALTER TABLE user_subscriptions ADD COLUMN revenuecat_entitlement_id text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'revenuecat_platform') THEN
        ALTER TABLE user_subscriptions ADD COLUMN revenuecat_platform text;
    END IF;
END $$;

-- Create RevenueCat products table
CREATE TABLE IF NOT EXISTS revenuecat_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  platform text NOT NULL, -- 'ios', 'android', 'web'
  price numeric(10,2),
  currency text DEFAULT 'USD',
  interval text, -- 'month', 'year', 'week', 'lifetime'
  interval_count integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create RevenueCat entitlements table
CREATE TABLE IF NOT EXISTS revenuecat_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entitlement_id text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  features text[] DEFAULT '{}', -- Array of feature names this entitlement unlocks
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create RevenueCat subscriptions table for detailed tracking
CREATE TABLE IF NOT EXISTS revenuecat_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  revenuecat_user_id text NOT NULL,
  product_id text NOT NULL,
  entitlement_id text NOT NULL,
  platform text NOT NULL,
  purchase_date timestamptz NOT NULL,
  expiration_date timestamptz,
  is_active boolean DEFAULT true,
  is_trial boolean DEFAULT false,
  is_sandbox boolean DEFAULT false,
  original_transaction_id text,
  latest_receipt_info jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_revenuecat_products_product_id ON revenuecat_products(product_id);
CREATE INDEX IF NOT EXISTS idx_revenuecat_products_platform ON revenuecat_products(platform);
CREATE INDEX IF NOT EXISTS idx_revenuecat_entitlements_entitlement_id ON revenuecat_entitlements(entitlement_id);
CREATE INDEX IF NOT EXISTS idx_revenuecat_subscriptions_user_id ON revenuecat_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_revenuecat_subscriptions_revenuecat_user_id ON revenuecat_subscriptions(revenuecat_user_id);
CREATE INDEX IF NOT EXISTS idx_revenuecat_subscriptions_product_id ON revenuecat_subscriptions(product_id);
CREATE INDEX IF NOT EXISTS idx_revenuecat_subscriptions_entitlement_id ON revenuecat_subscriptions(entitlement_id);
CREATE INDEX IF NOT EXISTS idx_revenuecat_subscriptions_active ON revenuecat_subscriptions(user_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE revenuecat_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenuecat_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenuecat_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for revenuecat_products (public read)
CREATE POLICY "RevenueCat products are publicly readable" ON revenuecat_products
  FOR SELECT USING (true);

-- RLS Policies for revenuecat_entitlements (public read)
CREATE POLICY "RevenueCat entitlements are publicly readable" ON revenuecat_entitlements
  FOR SELECT USING (true);

-- RLS Policies for revenuecat_subscriptions
CREATE POLICY "Users can view their own RevenueCat subscriptions" ON revenuecat_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own RevenueCat subscriptions" ON revenuecat_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own RevenueCat subscriptions" ON revenuecat_subscriptions
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Function to sync RevenueCat subscription with user_subscriptions
CREATE OR REPLACE FUNCTION sync_revenuecat_subscription(
  p_user_id uuid,
  p_revenuecat_user_id text,
  p_product_id text,
  p_entitlement_id text,
  p_platform text,
  p_purchase_date timestamptz,
  p_expiration_date timestamptz,
  p_is_active boolean,
  p_is_trial boolean,
  p_original_transaction_id text,
  p_latest_receipt_info jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_type text;
  v_interval text;
BEGIN
  -- Get product details to determine subscription type
  SELECT interval INTO v_interval
  FROM revenuecat_products
  WHERE product_id = p_product_id;
  
  -- Map interval to subscription type
  v_subscription_type := CASE 
    WHEN v_interval = 'month' THEN 'monthly'
    WHEN v_interval = 'year' THEN 'yearly'
    ELSE 'monthly'
  END;
  
  -- Insert or update RevenueCat subscription
  INSERT INTO revenuecat_subscriptions (
    user_id, revenuecat_user_id, product_id, entitlement_id, platform,
    purchase_date, expiration_date, is_active, is_trial, original_transaction_id,
    latest_receipt_info
  ) VALUES (
    p_user_id, p_revenuecat_user_id, p_product_id, p_entitlement_id, p_platform,
    p_purchase_date, p_expiration_date, p_is_active, p_is_trial, p_original_transaction_id,
    p_latest_receipt_info
  )
  ON CONFLICT (user_id, product_id, platform)
  DO UPDATE SET
    revenuecat_user_id = EXCLUDED.revenuecat_user_id,
    entitlement_id = EXCLUDED.entitlement_id,
    purchase_date = EXCLUDED.purchase_date,
    expiration_date = EXCLUDED.expiration_date,
    is_active = EXCLUDED.is_active,
    is_trial = EXCLUDED.is_trial,
    original_transaction_id = EXCLUDED.original_transaction_id,
    latest_receipt_info = EXCLUDED.latest_receipt_info,
    updated_at = now();
  
  -- Update user_subscriptions table
  INSERT INTO user_subscriptions (
    user_id, subscription_type, status, current_period_start, current_period_end,
    revenuecat_subscription_id, revenuecat_product_id, revenuecat_entitlement_id, revenuecat_platform
  ) VALUES (
    p_user_id, v_subscription_type, 
    CASE WHEN p_is_active THEN 'active' ELSE 'inactive' END,
    p_purchase_date, p_expiration_date,
    p_original_transaction_id, p_product_id, p_entitlement_id, p_platform
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    subscription_type = EXCLUDED.subscription_type,
    status = EXCLUDED.status,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    revenuecat_subscription_id = EXCLUDED.revenuecat_subscription_id,
    revenuecat_product_id = EXCLUDED.revenuecat_product_id,
    revenuecat_entitlement_id = EXCLUDED.revenuecat_entitlement_id,
    revenuecat_platform = EXCLUDED.revenuecat_platform,
    updated_at = now();
  
  -- Update users table
  UPDATE users SET
    subscription_status = CASE WHEN p_is_active THEN 'active' ELSE 'inactive' END,
    revenuecat_user_id = p_revenuecat_user_id,
    revenuecat_platform = p_platform,
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- Function to check if user has active RevenueCat subscription
CREATE OR REPLACE FUNCTION has_revenuecat_subscription(p_user_id uuid, p_entitlement_id text DEFAULT 'premium')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_subscription boolean := false;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM revenuecat_subscriptions
    WHERE user_id = p_user_id
    AND entitlement_id = p_entitlement_id
    AND is_active = true
    AND (expiration_date IS NULL OR expiration_date > now())
  ) INTO v_has_subscription;
  
  RETURN v_has_subscription;
END;
$$;

-- Insert default RevenueCat products
INSERT INTO revenuecat_products (product_id, name, description, platform, price, currency, interval, interval_count) VALUES
('premium_monthly', 'Premium Monthly', 'Monthly premium subscription', 'ios', 9.99, 'USD', 'month', 1),
('premium_yearly', 'Premium Yearly', 'Yearly premium subscription', 'ios', 99.99, 'USD', 'year', 1),
('premium_monthly_android', 'Premium Monthly', 'Monthly premium subscription', 'android', 9.99, 'USD', 'month', 1),
('premium_yearly_android', 'Premium Yearly', 'Yearly premium subscription', 'android', 99.99, 'USD', 'year', 1)
ON CONFLICT (product_id) DO NOTHING;

-- Insert default RevenueCat entitlements
INSERT INTO revenuecat_entitlements (entitlement_id, name, description, features) VALUES
('premium', 'Premium Features', 'Access to all premium features', ARRAY['create_listings', 'host_events', 'advanced_analytics', 'priority_support'])
ON CONFLICT (entitlement_id) DO NOTHING;


