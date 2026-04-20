package com.cuemath.flashcard.test.dto;

import java.util.List;
import java.util.UUID;

public record McqQuestion(
        UUID cardId,
        String question,
        List<String> options,   // 4 shuffled options
        int correctIndex        // index of correct option BEFORE shuffle (frontend ignores this – server validates)
) {}
