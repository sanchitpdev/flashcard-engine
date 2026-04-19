CREATE TABLE card_reviews (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id           UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    easiness_factor   FLOAT NOT NULL DEFAULT 2.5,
    interval_days     INT NOT NULL DEFAULT 1,
    repetitions       INT NOT NULL DEFAULT 0,
    next_review_at    DATE,
    last_reviewed_at  TIMESTAMP,
    created_at        TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (user_id, card_id)
);

CREATE INDEX idx_card_reviews_user_id ON card_reviews(user_id);
CREATE INDEX idx_card_reviews_card_id ON card_reviews(card_id);
