-- Rollback: Drop DAG relationships table
DROP INDEX IF EXISTS idx_dag_blue_scores;
DROP INDEX IF EXISTS idx_dag_selected_parent;
DROP INDEX IF EXISTS idx_dag_parent;
DROP INDEX IF EXISTS idx_dag_child;
DROP TABLE IF EXISTS dag_relationships;

