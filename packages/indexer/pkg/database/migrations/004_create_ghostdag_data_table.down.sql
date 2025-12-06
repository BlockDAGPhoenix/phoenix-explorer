-- Rollback: Drop GHOSTDAG data table
DROP INDEX IF EXISTS idx_ghostdag_merge_set_reds;
DROP INDEX IF EXISTS idx_ghostdag_merge_set_blues;
DROP INDEX IF EXISTS idx_ghostdag_selected_parent;
DROP INDEX IF EXISTS idx_ghostdag_blue_score;
DROP TABLE IF EXISTS ghostdag_data;

