CREATE TABLE misconception_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id             UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    selected_distractor TEXT,
    misconception_type  VARCHAR(255),
    logged_at           TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_misconception_logs_user_id ON misconception_logs(user_id);
