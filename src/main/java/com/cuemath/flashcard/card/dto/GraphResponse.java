package com.cuemath.flashcard.card.dto;

import java.util.List;
import java.util.UUID;

public record GraphResponse(
        List<NodeDto> nodes,
        List<EdgeDto> edges
) {
    public record NodeDto(UUID id, String conceptName) {}
    public record EdgeDto(UUID from, UUID to) {}
}
