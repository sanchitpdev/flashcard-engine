package com.cuemath.flashcard.test.repository;

import com.cuemath.flashcard.test.entity.TestSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TestSessionRepository extends JpaRepository<TestSession, UUID> {
    List<TestSession> findByUserIdAndDeckIdOrderByTakenAtDesc(UUID userId, UUID deckId);
    List<TestSession> findByUserIdOrderByTakenAtDesc(UUID userId);
}
