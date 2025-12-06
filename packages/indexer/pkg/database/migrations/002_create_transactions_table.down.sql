-- Rollback: Drop transactions table
DROP INDEX IF EXISTS idx_transactions_to_addresses;
DROP INDEX IF EXISTS idx_transactions_addresses;
DROP INDEX IF EXISTS idx_transactions_contract;
DROP INDEX IF EXISTS idx_transactions_status;
DROP INDEX IF EXISTS idx_transactions_timestamp;
DROP INDEX IF EXISTS idx_transactions_to;
DROP INDEX IF EXISTS idx_transactions_from;
DROP INDEX IF EXISTS idx_transactions_block_number;
DROP INDEX IF EXISTS idx_transactions_block_hash;
DROP TABLE IF EXISTS transactions;

