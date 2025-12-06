-- Migration: Create transactions table
-- Created: 2025-01-24
-- Description: Creates the transactions table for storing all transactions

CREATE TABLE IF NOT EXISTS transactions (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,
    
    -- Transaction Identification
    hash VARCHAR(66) NOT NULL UNIQUE,
    block_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    transaction_index INTEGER NOT NULL,
    
    -- Transaction Parties
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42),
    
    -- Transaction Data
    value NUMERIC(78, 0) NOT NULL DEFAULT 0,
    input_data TEXT,
    nonce BIGINT NOT NULL DEFAULT 0,
    
    -- Gas Information
    gas_limit BIGINT NOT NULL DEFAULT 0,
    gas_price NUMERIC(78, 0),
    max_fee_per_gas NUMERIC(78, 0),
    max_priority_fee_per_gas NUMERIC(78, 0),
    gas_used BIGINT,
    effective_gas_price NUMERIC(78, 0),
    
    -- Transaction Status
    status SMALLINT,
    transaction_type SMALLINT DEFAULT 0,
    
    -- Signature
    v INTEGER,
    r VARCHAR(66),
    s VARCHAR(66),
    
    -- Contract Creation
    creates_contract BOOLEAN DEFAULT false,
    contract_address VARCHAR(42),
    
    -- Timestamps
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign Keys
    CONSTRAINT fk_transactions_block FOREIGN KEY (block_hash) 
        REFERENCES blocks(hash) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_tx_hash_format CHECK (hash ~ '^0x[0-9a-f]{64}$'),
    CONSTRAINT chk_address_format CHECK (
        from_address ~ '^0x[0-9a-fA-F]{40}$' AND
        (to_address IS NULL OR to_address ~ '^0x[0-9a-fA-F]{40}$')
    )
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_block_hash ON transactions(block_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_block_number ON transactions(block_number DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_address) WHERE to_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_contract ON transactions(contract_address) WHERE contract_address IS NOT NULL;

-- Composite indexes for address transaction history
CREATE INDEX IF NOT EXISTS idx_transactions_addresses ON transactions(from_address, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_to_addresses ON transactions(to_address, timestamp DESC) 
    WHERE to_address IS NOT NULL;

