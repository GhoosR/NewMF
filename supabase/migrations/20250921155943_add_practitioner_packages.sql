/*
  # Add practitioner packages support

  1. New Table: practitioner_packages
    - Stores package information for practitioners
    - Links to practitioners table
    - Includes name, description, price, and features
  
  2. Updates to practitioners table
    - Remove price_list column (will be replaced by packages)
    - Add starting_price and currency columns for quick reference
  
  3. Notes
    - Enables Fiverr-like tiered pricing
    - Supports multiple packages per practitioner
    - Maintains backward compatibility with existing features
*/

-- Create practitioner_packages table
CREATE TABLE IF NOT EXISTS practitioner_packages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  practitioner_id uuid REFERENCES practitioners(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  price numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  features text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies for practitioner_packages
ALTER TABLE practitioner_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public practitioner packages are viewable by everyone"
  ON practitioner_packages
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own practitioner packages"
  ON practitioner_packages
  FOR INSERT
  WITH CHECK (
    practitioner_id IN (
      SELECT id FROM practitioners 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own practitioner packages"
  ON practitioner_packages
  FOR UPDATE
  USING (
    practitioner_id IN (
      SELECT id FROM practitioners 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    practitioner_id IN (
      SELECT id FROM practitioners 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own practitioner packages"
  ON practitioner_packages
  FOR DELETE
  USING (
    practitioner_id IN (
      SELECT id FROM practitioners 
      WHERE user_id = auth.uid()
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_practitioner_packages_practitioner_id 
  ON practitioner_packages(practitioner_id);

-- Update practitioners table
DO $$
BEGIN
  -- Add starting_price column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practitioners' AND column_name = 'starting_price'
  ) THEN
    ALTER TABLE practitioners ADD COLUMN starting_price numeric(10,2);
  END IF;

  -- Add currency column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practitioners' AND column_name = 'currency'
  ) THEN
    ALTER TABLE practitioners ADD COLUMN currency text DEFAULT 'EUR';
  END IF;

  -- Drop price_list column if it exists (after migrating data)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practitioners' AND column_name = 'price_list'
  ) THEN
    -- First, migrate existing price_list data to starting_price and currency
    UPDATE practitioners
    SET 
      starting_price = (
        CASE 
          WHEN price_list ~ '^\d+' THEN 
            (regexp_match(price_list, '^\d+'))[1]::numeric
          ELSE NULL 
        END
      ),
      currency = (
        CASE 
          WHEN price_list LIKE '%EUR%' THEN 'EUR'
          WHEN price_list LIKE '%USD%' THEN 'USD'
          WHEN price_list LIKE '%GBP%' THEN 'GBP'
          WHEN price_list LIKE '%€%' THEN 'EUR'
          WHEN price_list LIKE '%$%' THEN 'USD'
          WHEN price_list LIKE '%£%' THEN 'GBP'
          ELSE 'EUR'
        END
      )
    WHERE price_list IS NOT NULL;

    -- Then drop the column
    ALTER TABLE practitioners DROP COLUMN price_list;
  END IF;
END $$;


