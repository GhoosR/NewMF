-- Add Stripe customer ID to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_connect_status TEXT CHECK (stripe_connect_status IN ('pending', 'connected', 'disconnected'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id 
ON users(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_users_stripe_connect_id
ON users(stripe_connect_id);