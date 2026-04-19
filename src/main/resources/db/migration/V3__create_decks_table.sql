CREATE TABLE decks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    source_filename VARCHAR(255),
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    status          VARCHAR(20) NOT NULL DEFAULT 'PROCESSING'
        CONSTRAINT decks_status_check CHECK (status IN ('PROCESSING', 'READY', 'FAILED'))
);

CREATE INDEX idx_decks_user_id ON decks(user_id);
