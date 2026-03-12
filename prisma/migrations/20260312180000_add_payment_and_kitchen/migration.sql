-- Add payment and kitchen tracking fields

-- PaymentMethod enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '\"PaymentMethod\"') THEN
    CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'QR');
  END IF;
END$$;

-- Order table changes
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "payMethod" "PaymentMethod",
  ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);

-- OrderItem kitchen flag
ALTER TABLE "OrderItem"
  ADD COLUMN IF NOT EXISTS "sentToKitchen" BOOLEAN NOT NULL DEFAULT false;

