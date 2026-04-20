package com.cuemath.flashcard.test.dto;

public record CategoryScore(
        String category,
        int correct,
        int total,
        double pct
) {}
