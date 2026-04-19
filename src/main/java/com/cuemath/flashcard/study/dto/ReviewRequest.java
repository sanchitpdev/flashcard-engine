package com.cuemath.flashcard.study.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ReviewRequest(
        @NotNull UUID cardId,
        @Min(0) @Max(5) int rating
) {}
