package com.cuemath.flashcard.test.dto;

import java.util.List;
import java.util.UUID;

public record SubmitTestRequest(
        UUID deckId,
        List<AnswerItem> answers
) {}
