CREATE TABLE cards (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id          UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    front            TEXT NOT NULL,
    back             TEXT NOT NULL,
    concept_name     VARCHAR(255) NOT NULL,
    concept_category VARCHAR(50) CHECK (concept_category IN ('definition','relationship','procedure','example','misconception')),
    difficulty       INTEGER CHECK (difficulty BETWEEN 1 AND 3),
    created_at       TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_cards_deck_id ON cards(deck_id);
