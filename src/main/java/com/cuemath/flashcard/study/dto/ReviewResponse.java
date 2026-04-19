package com.cuemath.flashcard.study.dto;

import java.time.LocalDate;
import java.util.UUID;

public record ReviewResponse(
        UUID cardId,
        int newIntervalDays,
        double newEasinessFactor,
        int newRepetitions,
        LocalDate nextReviewAt
) {}
