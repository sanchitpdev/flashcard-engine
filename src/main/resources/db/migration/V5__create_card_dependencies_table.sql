CREATE TABLE card_dependencies (
    card_id          UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    requires_card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, requires_card_id)
);
