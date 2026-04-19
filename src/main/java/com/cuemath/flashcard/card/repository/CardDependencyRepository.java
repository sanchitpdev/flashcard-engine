package com.cuemath.flashcard.card.repository;

import com.cuemath.flashcard.card.entity.CardDependency;
import com.cuemath.flashcard.card.entity.CardDependencyId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CardDependencyRepository extends JpaRepository<CardDependency, CardDependencyId> {
    // Derived query traverses the @EmbeddedId — Spring Data resolves id.cardId correctly
    List<CardDependency> findByIdCardId(UUID cardId);
}
