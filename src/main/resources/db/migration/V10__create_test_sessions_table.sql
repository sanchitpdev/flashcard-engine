CREATE TABLE test_sessions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deck_id      UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    total        INT  NOT NULL DEFAULT 0,
    correct      INT  NOT NULL DEFAULT 0,
    score_pct    NUMERIC(5,2) NOT NULL DEFAULT 0,
    taken_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_test_sessions_user_deck ON test_sessions(user_id, deck_id);
