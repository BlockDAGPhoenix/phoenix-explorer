-- Rollback: Drop blocks table
DROP INDEX IF EXISTS idx_blocks_parent_hashes;
DROP INDEX IF EXISTS idx_blocks_chain_blocks;
DROP INDEX IF EXISTS idx_blocks_selected_parent;
DROP INDEX IF EXISTS idx_blocks_miner;
DROP INDEX IF EXISTS idx_blocks_timestamp;
DROP INDEX IF EXISTS idx_blocks_blue_score;
DROP INDEX IF EXISTS idx_blocks_number;
DROP TABLE IF EXISTS blocks;

