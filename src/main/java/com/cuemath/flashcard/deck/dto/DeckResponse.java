package com.cuemath.flashcard.deck.dto;

import com.cuemath.flashcard.deck.entity.Deck;

import java.time.Instant;
import java.util.UUID;

public record DeckResponse(UUID id, String title, String sourceFilename, String status, Instant createdAt) {
    public static DeckResponse from(Deck deck) {
        return new DeckResponse(deck.getId(), deck.getTitle(), deck.getSourceFilename(),
                deck.getStatus().name(), deck.getCreatedAt());
    }
}
