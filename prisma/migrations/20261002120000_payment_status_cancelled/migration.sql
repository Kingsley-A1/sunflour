-- Closed (cancelled/rejected) orders must not leave an unpaid invoice behind.
ALTER TYPE "PaymentStatus" ADD VALUE 'CANCELLED';
