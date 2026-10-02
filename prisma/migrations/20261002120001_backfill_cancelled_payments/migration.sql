-- Separate migration: a new enum value cannot be used in the transaction that adds it.
UPDATE "orders"
SET "payment_status" = 'CANCELLED'
WHERE "status" IN ('CANCELLED', 'REJECTED')
  AND "payment_status" IN ('UNPAID', 'PROOF_SENT_ON_WHATSAPP', 'UNDER_REVIEW');
