package com.cuemath.flashcard.test.dto;

import java.util.List;
import java.util.UUID;

public record TestResultResponse(
        UUID sessionId,
        int total,
        int correct,
        double scorePct,
        List<QuestionResult> results,
        List<CategoryScore> categoryBreakdown
) {}
