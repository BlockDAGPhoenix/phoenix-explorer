-- Migration: Drop event logs table
-- Created: 2025-01-24
-- Description: Drops the event_logs table

DROP TABLE IF EXISTS event_logs CASCADE;

