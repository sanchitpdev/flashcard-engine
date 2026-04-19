package com.cuemath.flashcard.card.dto;

import com.cuemath.flashcard.card.entity.Card;

import java.time.Instant;
import java.util.UUID;

public record CardResponse(
        UUID id,
        UUID deckId,
        String front,
        String back,
        String conceptName,
        String conceptCategory,
        int difficulty,
        Instant createdAt
) {
    public static CardResponse from(Card card) {
        return new CardResponse(
                card.getId(),
                card.getDeck().getId(),
                card.getFront(),
                card.getBack(),
                card.getConceptName(),
                card.getConceptCategory(),
                card.getDifficulty(),
                card.getCreatedAt()
        );
    }
}
