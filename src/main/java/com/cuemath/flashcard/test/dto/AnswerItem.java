package com.cuemath.flashcard.test.dto;

import java.util.UUID;

public record AnswerItem(
        UUID cardId,
        String selectedAnswer   // the text the user chose
) {}
