-- Add the ACCOUNT_STATUS_NOTICE transactional email template key used when a
-- Super Admin suspends, reactivates, or removes an account.
ALTER TYPE "EmailTemplateKey" ADD VALUE 'ACCOUNT_STATUS_NOTICE';
