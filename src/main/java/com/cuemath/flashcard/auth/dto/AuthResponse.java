package com.cuemath.flashcard.auth.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String email
) {}
