package com.cuemath.flashcard.progress.dto;

import java.time.LocalDate;
import java.util.UUID;

public record CardMasteryDto(
        UUID cardId,
        String conceptName,
        String masteryLevel,   // "mastered" | "shaky" | "new"
        LocalDate nextReviewAt
) {}
