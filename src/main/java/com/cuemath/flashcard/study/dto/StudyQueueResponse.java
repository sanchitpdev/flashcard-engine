package com.cuemath.flashcard.study.dto;

import java.util.UUID;

public record StudyQueueResponse(
        UUID cardId,
        String front,
        String back,
        String conceptName,
        String conceptCategory,
        int difficulty,
        int intervalDays,
        int repetitions
) {}
