package com.cuemath.flashcard.deck.repository;

import com.cuemath.flashcard.deck.entity.Deck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeckRepository extends JpaRepository<Deck, UUID> {
    List<Deck> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<Deck> findByIdAndUserId(UUID id, UUID userId);
}
