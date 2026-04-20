package com.cuemath.flashcard.test.dto;

import java.util.UUID;

public record QuestionResult(
        UUID cardId,
        String question,
        String correctAnswer,
        String selectedAnswer,
        boolean correct,
        String conceptCategory
) {}
