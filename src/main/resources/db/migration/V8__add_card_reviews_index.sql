CREATE INDEX IF NOT EXISTS idx_card_reviews_user_next
    ON card_reviews(user_id, next_review_at);
