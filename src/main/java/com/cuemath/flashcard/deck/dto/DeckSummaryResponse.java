package com.cuemath.flashcard.deck.dto;

import com.cuemath.flashcard.deck.entity.Deck;

import java.time.Instant;
import java.util.UUID;

public record DeckSummaryResponse(
        UUID id,
        String title,
        String sourceFilename,
        String status,
        Instant createdAt,
        boolean hasPdf,
        Instant pdfGeneratedAt
) {
    public static DeckSummaryResponse from(Deck deck) {
        return new DeckSummaryResponse(
                deck.getId(),
                deck.getTitle(),
                deck.getSourceFilename(),
                deck.getStatus().name(),
                deck.getCreatedAt(),
                deck.getPdfData() != null,
                deck.getPdfGeneratedAt()
        );
    }
}
