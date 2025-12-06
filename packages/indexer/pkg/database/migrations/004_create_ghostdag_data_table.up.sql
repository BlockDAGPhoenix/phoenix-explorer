-- Migration: Create GHOSTDAG data table
-- Created: 2025-01-24
-- Description: Creates the ghostdag_data table for storing GHOSTDAG consensus data

CREATE TABLE IF NOT EXISTS ghostdag_data (
    -- Primary Key
    block_hash VARCHAR(66) PRIMARY KEY,
    
    -- GHOSTDAG Data
    blue_score BIGINT NOT NULL,
    blue_work NUMERIC(78, 0) NOT NULL,
    selected_parent VARCHAR(66),
    
    -- Merge Set (blocks in the past of this block)
    merge_set_blues TEXT[],
    merge_set_reds TEXT[],
    blues_anticone_sizes INTEGER[],
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign Key
    CONSTRAINT fk_ghostdag_block FOREIGN KEY (block_hash) 
        REFERENCES blocks(hash) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ghostdag_blue_score ON ghostdag_data(blue_score DESC);
CREATE INDEX IF NOT EXISTS idx_ghostdag_selected_parent ON ghostdag_data(selected_parent) WHERE selected_parent IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ghostdag_merge_set_blues ON ghostdag_data USING GIN(merge_set_blues);
CREATE INDEX IF NOT EXISTS idx_ghostdag_merge_set_reds ON ghostdag_data USING GIN(merge_set_reds);

