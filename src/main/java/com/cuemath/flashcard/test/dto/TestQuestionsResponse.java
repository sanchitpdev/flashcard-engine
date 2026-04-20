package com.cuemath.flashcard.test.dto;

import java.util.List;

public record TestQuestionsResponse(
        List<McqQuestion> questions
) {}
