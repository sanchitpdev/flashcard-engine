package com.cuemath.flashcard.card.service;

import com.cuemath.flashcard.card.dto.GraphResponse;
import com.cuemath.flashcard.card.entity.Card;
import com.cuemath.flashcard.card.entity.CardDependency;
import com.cuemath.flashcard.card.repository.CardDependencyRepository;
import com.cuemath.flashcard.card.repository.CardRepository;
import com.cuemath.flashcard.deck.repository.DeckRepository;
import com.cuemath.flashcard.exception.DeckNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DependencyGraphService {

    private final CardRepository cardRepository;
    private final CardDependencyRepository cardDependencyRepository;
    private final DeckRepository deckRepository;

    public GraphResponse buildGraph(UUID deckId, UUID userId) {
        deckRepository.findByIdAndUserId(deckId, userId)
                .orElseThrow(() -> new DeckNotFoundException(deckId));

        List<Card> cards = cardRepository.findByDeckId(deckId);

        List<GraphResponse.NodeDto> nodes = cards.stream()
                .map(c -> new GraphResponse.NodeDto(c.getId(), c.getConceptName()))
                .toList();

        List<GraphResponse.EdgeDto> edges = new ArrayList<>();
        for (Card card : cards) {
            for (CardDependency dep : cardDependencyRepository.findByIdCardId(card.getId())) {
                edges.add(new GraphResponse.EdgeDto(
                        dep.getId().getCardId(),
                        dep.getId().getRequiresCardId()));
            }
        }

        return new GraphResponse(nodes, edges);
    }
}
