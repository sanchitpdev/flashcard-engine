package com.cuemath.flashcard.exception;

import java.util.UUID;

public class DeckNotFoundException extends RuntimeException {
    public DeckNotFoundException(UUID deckId) {
        super("Deck not found: " + deckId);
    }
}
