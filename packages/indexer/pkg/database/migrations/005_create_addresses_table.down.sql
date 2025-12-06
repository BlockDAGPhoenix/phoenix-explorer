-- Rollback: Drop addresses table
DROP INDEX IF EXISTS idx_addresses_last_seen;
DROP INDEX IF EXISTS idx_addresses_transaction_count;
DROP INDEX IF EXISTS idx_addresses_balance;
DROP INDEX IF EXISTS idx_addresses_is_contract;
DROP TABLE IF EXISTS addresses;

