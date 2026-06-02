-- Migration v9: Add gamification sync columns to user_progress
-- These columns store gamification data that was previously only in localStorage,
-- enabling cross-device sync for streaks, hints, XP boosts, profile effects, and code runs.

ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS streak_data JSONB DEFAULT '{}';
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS hints_count INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS xp_boost_data JSONB DEFAULT '{}';
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS profile_effects JSONB DEFAULT '[]';
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS total_code_runs INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS gamification_synced_at TIMESTAMPTZ;
