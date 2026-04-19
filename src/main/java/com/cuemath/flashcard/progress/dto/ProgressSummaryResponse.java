package com.cuemath.flashcard.progress.dto;

public record ProgressSummaryResponse(
        int totalCards,
        int mastered,
        int shaky,
        int newCards,
        int dueToday
) {}
