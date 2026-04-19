package com.cuemath.flashcard.deck.repository;

import com.cuemath.flashcard.deck.entity.Deck;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeckRepository extends JpaRepository<Deck, UUID> {
    List<Deck> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<Deck> findByIdAndUserId(UUID id, UUID userId);
    List<Deck> findByUserIdAndStatus(UUID userId, Deck.DeckStatus status);
}
