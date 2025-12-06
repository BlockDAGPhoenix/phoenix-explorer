-- Migration: Create blocks table
-- Created: 2025-01-24
-- Description: Creates the blocks table for storing all blocks in the DAG

CREATE TABLE IF NOT EXISTS blocks (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,
    
    -- Block Identification
    hash VARCHAR(66) NOT NULL UNIQUE,
    number BIGINT NOT NULL,
    
    -- Block Content
    parent_hashes TEXT[] NOT NULL DEFAULT '{}',
    timestamp BIGINT NOT NULL,
    nonce VARCHAR(18),
    difficulty NUMERIC(78, 0),
    
    -- Miner Information
    miner_address VARCHAR(42),
    miner_reward NUMERIC(78, 0),
    
    -- Gas Information
    gas_limit BIGINT NOT NULL DEFAULT 0,
    gas_used BIGINT NOT NULL DEFAULT 0,
    base_fee_per_gas NUMERIC(78, 0),
    
    -- DAG-Specific Fields
    blue_score BIGINT NOT NULL DEFAULT 0,
    blue_work NUMERIC(78, 0),
    is_chain_block BOOLEAN DEFAULT true,
    selected_parent_hash VARCHAR(66),
    
    -- Merkle Roots
    transactions_root VARCHAR(66),
    state_root VARCHAR(66),
    receipts_root VARCHAR(66),
    
    -- Metadata
    size INTEGER,
    transaction_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    indexed_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_hash_format CHECK (hash ~ '^0x[0-9a-f]{64}$'),
    CONSTRAINT chk_positive_number CHECK (number >= 0),
    CONSTRAINT chk_positive_blue_score CHECK (blue_score >= 0)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_blocks_number ON blocks(number DESC);
CREATE INDEX IF NOT EXISTS idx_blocks_blue_score ON blocks(blue_score DESC);
CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_blocks_miner ON blocks(miner_address) WHERE miner_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blocks_selected_parent ON blocks(selected_parent_hash) WHERE selected_parent_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blocks_chain_blocks ON blocks(is_chain_block) WHERE is_chain_block = true;

-- GIN index for parent_hashes array
CREATE INDEX IF NOT EXISTS idx_blocks_parent_hashes ON blocks USING GIN(parent_hashes);

