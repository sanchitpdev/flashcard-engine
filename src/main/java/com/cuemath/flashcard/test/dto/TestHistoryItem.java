package com.cuemath.flashcard.test.dto;

import java.time.Instant;
import java.util.UUID;

public record TestHistoryItem(
        UUID sessionId,
        UUID deckId,
        String deckTitle,
        int total,
        int correct,
        double scorePct,
        Instant takenAt
) {}
