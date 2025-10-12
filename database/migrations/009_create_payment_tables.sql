-- Create payment status enum
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create payment provider enum
DO $$ BEGIN
    CREATE TYPE payment_provider AS ENUM ('paystack', 'flutterwave');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    reference VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    status payment_status DEFAULT 'pending',
    provider payment_provider DEFAULT 'paystack',
    provider_reference VARCHAR(255),
    provider_response JSONB,
    metadata JSONB,
    payment_date TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_amount CHECK (amount > 0)
);

-- Create payment items table for itemized payments
CREATE TABLE IF NOT EXISTS payment_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    fee_category_id UUID NOT NULL REFERENCES fee_categories(id),
    amount DECIMAL(10, 2) NOT NULL,
    academic_session VARCHAR(20),
    semester VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_item_amount CHECK (amount > 0)
);

-- Create payment receipts table
CREATE TABLE IF NOT EXISTS payment_receipts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES payments(id),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    generated_by UUID REFERENCES users(id),
    download_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at);

CREATE INDEX IF NOT EXISTS idx_payment_items_payment ON payment_items(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_items_fee ON payment_items(fee_category_id);

CREATE INDEX IF NOT EXISTS idx_receipts_payment ON payment_receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_number ON payment_receipts(receipt_number);

-- Add triggers for updated_at
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE payments IS 'Stores all payment transactions';
COMMENT ON TABLE payment_items IS 'Stores individual items within a payment';
COMMENT ON TABLE payment_receipts IS 'Stores generated payment receipts and their download URLs';