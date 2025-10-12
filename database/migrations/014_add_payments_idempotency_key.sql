-- migration: add idempotency_key to payments to support idempotent payment initialization

ALTER TABLE IF EXISTS payments
ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128);

-- create unique index to prevent duplicate in-flight payments for the same idempotency key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'payments' AND indexname = 'idx_payments_idempotency_key_unique'
    ) THEN
        CREATE UNIQUE INDEX idx_payments_idempotency_key_unique ON payments (idempotency_key);
    END IF;
END$$;
