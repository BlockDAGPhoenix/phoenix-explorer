-- Migration: Create event logs table
-- Created: 2025-01-24
-- Description: Creates the event_logs table for storing contract event logs

CREATE TABLE IF NOT EXISTS event_logs (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,
    
    -- Log Identification
    transaction_hash VARCHAR(66) NOT NULL,
    log_index INTEGER NOT NULL,
    block_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    
    -- Log Data
    address VARCHAR(42) NOT NULL,
    topics TEXT[] NOT NULL DEFAULT '{}',
    data TEXT,
    
    -- Event Signature (first topic for indexed events)
    event_signature VARCHAR(66),
    
    -- Timestamps
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign Keys
    CONSTRAINT fk_logs_transaction FOREIGN KEY (transaction_hash) 
        REFERENCES transactions(hash) ON DELETE CASCADE,
    CONSTRAINT fk_logs_block FOREIGN KEY (block_hash) 
        REFERENCES blocks(hash) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_log_address_format CHECK (address ~ '^0x[0-9a-fA-F]{40}$'),
    CONSTRAINT chk_log_index_positive CHECK (log_index >= 0),
    UNIQUE (transaction_hash, log_index)
);

-- Indexes for log filtering (eth_getLogs)
CREATE INDEX IF NOT EXISTS idx_logs_address ON event_logs(address);
CREATE INDEX IF NOT EXISTS idx_logs_block_number ON event_logs(block_number DESC);
CREATE INDEX IF NOT EXISTS idx_logs_transaction ON event_logs(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_logs_topics ON event_logs USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON event_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_event_signature ON event_logs(event_signature) 
    WHERE event_signature IS NOT NULL;

-- Composite index for address and block range queries
CREATE INDEX IF NOT EXISTS idx_logs_address_block_range ON event_logs(address, block_number DESC);

