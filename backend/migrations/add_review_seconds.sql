-- Add seconds_count column to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS seconds_count INTEGER DEFAULT 0;

-- Create review_seconds table to track which users have seconded which reviews
CREATE TABLE IF NOT EXISTS review_seconds (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(review_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_review_seconds_review_id ON review_seconds(review_id);
CREATE INDEX IF NOT EXISTS idx_review_seconds_user_id ON review_seconds(user_id);
