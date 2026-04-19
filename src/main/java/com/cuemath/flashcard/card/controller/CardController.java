package com.cuemath.flashcard.card.controller;

import com.cuemath.flashcard.card.dto.CardResponse;
import com.cuemath.flashcard.card.dto.GraphResponse;
import com.cuemath.flashcard.card.repository.CardRepository;
import com.cuemath.flashcard.card.service.DependencyGraphService;
import com.cuemath.flashcard.deck.repository.DeckRepository;
import com.cuemath.flashcard.exception.DeckNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/decks")
@RequiredArgsConstructor
public class CardController {

    private final CardRepository cardRepository;
    private final DeckRepository deckRepository;
    private final DependencyGraphService dependencyGraphService;

    /**
     * GET /api/decks/{id}/cards — list all cards for a deck the caller owns.
     */
    @GetMapping("/{id}/cards")
    public ResponseEntity<List<CardResponse>> getCards(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = UUID.fromString(userDetails.getUsername());
        deckRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new DeckNotFoundException(id));

        List<CardResponse> cards = cardRepository.findByDeckId(id)
                .stream()
                .map(CardResponse::from)
                .toList();

        return ResponseEntity.ok(cards);
    }

    /**
     * GET /api/decks/{id}/graph — prerequisite dependency graph for a deck.
     */
    @GetMapping("/{id}/graph")
    public ResponseEntity<GraphResponse> getGraph(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(dependencyGraphService.buildGraph(id, userId));
    }
}
