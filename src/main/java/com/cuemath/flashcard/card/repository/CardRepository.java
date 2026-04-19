package com.cuemath.flashcard.card.repository;

import com.cuemath.flashcard.card.entity.Card;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CardRepository extends JpaRepository<Card, UUID> {
    List<Card> findByDeckId(UUID deckId);
    List<Card> findByDeckIdIn(List<UUID> deckIds);
    Optional<Card> findByDeckIdAndConceptName(UUID deckId, String conceptName);
}
