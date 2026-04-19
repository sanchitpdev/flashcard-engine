package com.cuemath.flashcard.progress.dto;

import java.util.List;
import java.util.UUID;

public record DeckProgressResponse(
        UUID deckId,
        String deckTitle,
        int totalCards,
        int mastered,
        int shaky,
        int newCards,
        int dueToday,
        List<CardMasteryDto> cards
) {}
