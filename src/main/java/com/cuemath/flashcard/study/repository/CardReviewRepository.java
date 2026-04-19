package com.cuemath.flashcard.study.repository;

import com.cuemath.flashcard.study.entity.CardReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CardReviewRepository extends JpaRepository<CardReview, UUID> {
    Optional<CardReview> findByUserIdAndCardId(UUID userId, UUID cardId);
    List<CardReview> findByUserId(UUID userId);
}
