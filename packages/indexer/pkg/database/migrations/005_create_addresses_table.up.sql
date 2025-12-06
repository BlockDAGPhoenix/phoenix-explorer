-- Migration: Create addresses table
-- Created: 2025-01-24
-- Description: Creates the addresses table for storing address information

CREATE TABLE IF NOT EXISTS addresses (
    -- Primary Key
    address VARCHAR(42) PRIMARY KEY,
    
    -- Balance Information
    balance NUMERIC(78, 0) DEFAULT 0,
    nonce BIGINT DEFAULT 0,
    
    -- Contract Information
    is_contract BOOLEAN DEFAULT false,
    contract_code TEXT,
    contract_code_hash VARCHAR(66),
    
    -- Statistics
    transaction_count BIGINT DEFAULT 0,
    gas_used BIGINT DEFAULT 0,
    gas_paid NUMERIC(78, 0) DEFAULT 0,
    
    -- Token Holdings (denormalized for performance)
    erc20_token_count INTEGER DEFAULT 0,
    erc721_token_count INTEGER DEFAULT 0,
    erc1155_token_count INTEGER DEFAULT 0,
    
    -- Timestamps
    first_seen_at TIMESTAMP,
    last_seen_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_address_format CHECK (address ~ '^0x[0-9a-fA-F]{40}$')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_addresses_is_contract ON addresses(is_contract) WHERE is_contract = true;
CREATE INDEX IF NOT EXISTS idx_addresses_balance ON addresses(balance DESC) WHERE balance > 0;
CREATE INDEX IF NOT EXISTS idx_addresses_transaction_count ON addresses(transaction_count DESC);
CREATE INDEX IF NOT EXISTS idx_addresses_last_seen ON addresses(last_seen_at DESC);

