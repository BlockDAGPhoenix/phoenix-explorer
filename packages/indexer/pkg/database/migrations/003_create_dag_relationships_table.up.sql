-- Migration: Create DAG relationships table
-- Created: 2025-01-24
-- Description: Creates the dag_relationships table for storing parent-child relationships

CREATE TABLE IF NOT EXISTS dag_relationships (
    -- Composite Primary Key
    child_hash VARCHAR(66) NOT NULL,
    parent_hash VARCHAR(66) NOT NULL,
    
    -- Relationship Metadata
    is_selected_parent BOOLEAN DEFAULT false,
    parent_blue_score BIGINT,
    child_blue_score BIGINT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    
    PRIMARY KEY (child_hash, parent_hash),
    
    -- Foreign Keys
    CONSTRAINT fk_dag_child FOREIGN KEY (child_hash) 
        REFERENCES blocks(hash) ON DELETE CASCADE,
    CONSTRAINT fk_dag_parent FOREIGN KEY (parent_hash) 
        REFERENCES blocks(hash) ON DELETE CASCADE
);

-- Indexes for graph traversal
CREATE INDEX IF NOT EXISTS idx_dag_child ON dag_relationships(child_hash);
CREATE INDEX IF NOT EXISTS idx_dag_parent ON dag_relationships(parent_hash);
CREATE INDEX IF NOT EXISTS idx_dag_selected_parent ON dag_relationships(is_selected_parent) 
    WHERE is_selected_parent = true;
CREATE INDEX IF NOT EXISTS idx_dag_blue_scores ON dag_relationships(child_blue_score, parent_blue_score);

