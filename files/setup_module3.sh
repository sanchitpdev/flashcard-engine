#!/bin/bash
set -euo pipefail

echo "=============================================="
echo " Module 3: SM-2 Scheduler + Topology Gate    "
echo "=============================================="

# ─── Directories ──────────────────────────────────────────────────────────────
mkdir -p src/main/resources/db/migration
mkdir -p src/main/java/com/cuemath/flashcard/study/entity
mkdir -p src/main/java/com/cuemath/flashcard/study/repository
mkdir -p src/main/java/com/cuemath/flashcard/study/dto
mkdir -p src/main/java/com/cuemath/flashcard/study/service
mkdir -p src/main/java/com/cuemath/flashcard/study/controller

# ─── V6__create_card_reviews_table.sql ────────────────────────────────────────
cat > src/main/resources/db/migration/V6__create_card_reviews_table.sql << 'EOF'
CREATE TABLE card_reviews (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id           UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    easiness_factor   FLOAT NOT NULL DEFAULT 2.5,
    interval_days     INT NOT NULL DEFAULT 1,
    repetitions       INT NOT NULL DEFAULT 0,
    next_review_at    DATE,
    last_reviewed_at  TIMESTAMP,
    created_at        TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (user_id, card_id)
);

CREATE INDEX idx_card_reviews_user_id ON card_reviews(user_id);
CREATE INDEX idx_card_reviews_card_id ON card_reviews(card_id);
EOF

echo "Created V6__create_card_reviews_table.sql"

# ─── V7__create_misconception_logs_table.sql ──────────────────────────────────
cat > src/main/resources/db/migration/V7__create_misconception_logs_table.sql << 'EOF'
CREATE TABLE misconception_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id             UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    selected_distractor TEXT,
    misconception_type  VARCHAR(255),
    logged_at           TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_misconception_logs_user_id ON misconception_logs(user_id);
EOF

echo "Created V7__create_misconception_logs_table.sql"

# ─── CardReview.java ──────────────────────────────────────────────────────────
cat > src/main/java/com/cuemath/flashcard/study/entity/CardReview.java << 'EOF'
package com.cuemath.flashcard.study.entity;

import com.cuemath.flashcard.auth.entity.User;
import com.cuemath.flashcard.card.entity.Card;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "card_reviews")
@Getter
@Setter
@NoArgsConstructor
public class CardReview {

    @Id
    @UuidGenerator
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    private Card card;

    @Column(name = "easiness_factor", nullable = false)
    private double easinessFactor = 2.5;

    @Column(name = "interval_days", nullable = false)
    private int intervalDays = 1;

    @Column(name = "repetitions", nullable = false)
    private int repetitions = 0;

    @Column(name = "next_review_at")
    private LocalDate nextReviewAt;

    @Column(name = "last_reviewed_at")
    private Instant lastReviewedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = Instant.now();
    }
}
EOF

echo "Created CardReview.java"

# ─── MisconceptionLog.java ────────────────────────────────────────────────────
cat > src/main/java/com/cuemath/flashcard/study/entity/MisconceptionLog.java << 'EOF'
package com.cuemath.flashcard.study.entity;

import com.cuemath.flashcard.auth.entity.User;
import com.cuemath.flashcard.card.entity.Card;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "misconception_logs")
@Getter
@Setter
@NoArgsConstructor
public class MisconceptionLog {

    @Id
    @UuidGenerator
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    private Card card;

    @Column(name = "selected_distractor", columnDefinition = "TEXT")
    private String selectedDistractor;

    @Column(name = "misconception_type")
    private String misconceptionType;

    @Column(name = "logged_at", nullable = false, updatable = false)
    private Instant loggedAt;

    @PrePersist
    void prePersist() {
        this.loggedAt = Instant.now();
    }
}
EOF

echo "Created MisconceptionLog.java"

# ─── CardReviewRepository.java ────────────────────────────────────────────────
cat > src/main/java/com/cuemath/flashcard/study/repository/CardReviewRepository.java << 'EOF'
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
EOF

echo "Created CardReviewRepository.java"

# ─── MisconceptionLogRepository.java ─────────────────────────────────────────
cat > src/main/java/com/cuemath/flashcard/study/repository/MisconceptionLogRepository.java << 'EOF'
package com.cuemath.flashcard.study.repository;

import com.cuemath.flashcard.study.entity.MisconceptionLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MisconceptionLogRepository extends JpaRepository<MisconceptionLog, UUID> {
    List<MisconceptionLog> findByUserId(UUID userId);
}
EOF

echo "Created MisconceptionLogRepository.java"

# ─── StudyQueueResponse.java ──────────────────────────────────────────────────
cat > src/main/java/com/cuemath/flashcard/study/dto/StudyQueueResponse.java << 'EOF'
package com.cuemath.flashcard.study.dto;

import java.util.UUID;

public record StudyQueueResponse(
        UUID cardId,
        String front,
        String back,
        String conceptName,
        String conceptCategory,
        int difficulty,
        int intervalDays,
        int repetitions
) {}
EOF

echo "Created StudyQueueResponse.java"

# ─── ReviewRequest.java ───────────────────────────────────────────────────────
cat > src/main/java/com/cuemath/flashcard/study/dto/ReviewRequest.java << 'EOF'
package com.cuemath.flashcard.study.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ReviewRequest(
        @NotNull UUID cardId,
        @Min(0) @Max(5) int rating
) {}
EOF

echo "Created ReviewRequest.java"

# ─── ReviewResponse.java ──────────────────────────────────────────────────────
cat > src/main/java/com/cuemath/flashcard/study/dto/ReviewResponse.java << 'EOF'
package com.cuemath.flashcard.study.dto;

import java.time.LocalDate;
import java.util.UUID;

public record ReviewResponse(
        UUID cardId,
        int newIntervalDays,
        double newEasinessFactor,
        int newRepetitions,
        LocalDate nextReviewAt
) {}
EOF

echo "Created ReviewResponse.java"

# ─── Sm2Service.java ──────────────────────────────────────────────────────────
cat > src/main/java/com/cuemath/flashcard/study/service/Sm2Service.java << 'EOF'
package com.cuemath.flashcard.study.service;

import org.springframework.stereotype.Service;

import java.time.LocalDate;

/**
 * Pure SM-2 algorithm implementation.
 * Stateless — no Spring dependencies beyond @Service.
 */
@Service
public class Sm2Service {

    public record Sm2Result(double newEasinessFactor, int newIntervalDays, int newRepetitions, LocalDate nextReviewAt) {}

    /**
     * Calculate updated SM-2 values.
     *
     * @param quality      response quality 0–5
     * @param easinessFactor current EF (default 2.5)
     * @param intervalDays   current interval in days
     * @param repetitions    number of successful reviews so far
     */
    public Sm2Result calculate(int quality, double easinessFactor, int intervalDays, int repetitions) {
        int newRepetitions;
        int newInterval;
        double newEF = easinessFactor;

        if (quality < 3) {
            // Forget: reset progress
            newRepetitions = 0;
            newInterval = 1;
        } else {
            // Correct response: update EF
            double efDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
            newEF = Math.max(1.3, easinessFactor + efDelta);

            if (repetitions == 0) {
                newInterval = 1;
            } else if (repetitions == 1) {
                newInterval = 6;
            } else {
                newInterval = (int) Math.round(intervalDays * newEF);
            }
            newRepetitions = repetitions + 1;
        }

        LocalDate nextReview = LocalDate.now().plusDays(newInterval);
        return new Sm2Result(newEF, newInterval, newRepetitions, nextReview);
    }
}
EOF

echo "Created Sm2Service.java"

# ─── SchedulerService.java ────────────────────────────────────────────────────
cat > src/main/java/com/cuemath/flashcard/study/service/SchedulerService.java << 'EOF'
package com.cuemath.flashcard.study.service;

import com.cuemath.flashcard.auth.entity.User;
import com.cuemath.flashcard.auth.repository.UserRepository;
import com.cuemath.flashcard.card.entity.Card;
import com.cuemath.flashcard.card.entity.CardDependency;
import com.cuemath.flashcard.card.repository.CardDependencyRepository;
import com.cuemath.flashcard.card.repository.CardRepository;
import com.cuemath.flashcard.deck.entity.Deck;
import com.cuemath.flashcard.deck.repository.DeckRepository;
import com.cuemath.flashcard.exception.CardNotFoundException;
import com.cuemath.flashcard.study.dto.ReviewRequest;
import com.cuemath.flashcard.study.dto.ReviewResponse;
import com.cuemath.flashcard.study.dto.StudyQueueResponse;
import com.cuemath.flashcard.study.entity.CardReview;
import com.cuemath.flashcard.study.repository.CardReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SchedulerService {

    private final CardRepository cardRepository;
    private final CardDependencyRepository cardDependencyRepository;
    private final CardReviewRepository cardReviewRepository;
    private final DeckRepository deckRepository;
    private final UserRepository userRepository;
    private final Sm2Service sm2Service;

    /**
     * Build the study queue for a user applying the topology gate.
     *
     * Topology Gate rules:
     *  1. Only cards from READY decks owned by the user.
     *  2. A prerequisite is "mastered" if repetitions >= 2 AND easinessFactor >= 2.0.
     *  3. If ANY prerequisite is not mastered → skip the card.
     *  4. Include card if next_review_at <= today OR no review row exists.
     */
    @Transactional(readOnly = true)
    public List<StudyQueueResponse> buildQueue(UUID userId) {
        // 1. Fetch all READY decks for the user
        List<Deck> readyDecks = deckRepository.findByUserIdAndStatus(userId, Deck.DeckStatus.READY);
        if (readyDecks.isEmpty()) return Collections.emptyList();

        List<UUID> deckIds = readyDecks.stream().map(Deck::getId).toList();

        // 2. Fetch all cards in those decks
        List<Card> allCards = cardRepository.findByDeckIdIn(deckIds);
        if (allCards.isEmpty()) return Collections.emptyList();

        // 3. Build a map of cardId → review row for this user
        Map<UUID, CardReview> reviewMap = cardReviewRepository.findByUserId(userId)
                .stream()
                .collect(Collectors.toMap(cr -> cr.getCard().getId(), cr -> cr));

        LocalDate today = LocalDate.now();
        List<StudyQueueResponse> queue = new ArrayList<>();

        for (Card card : allCards) {
            // 4. Check prerequisite mastery
            List<CardDependency> deps = cardDependencyRepository.findByIdCardId(card.getId());

            boolean allPrereqsMastered = deps.stream().allMatch(dep -> {
                UUID prereqId = dep.getId().getRequiresCardId();
                CardReview prereqReview = reviewMap.get(prereqId);
                if (prereqReview == null) return false; // never reviewed → not mastered
                return prereqReview.getRepetitions() >= 2 && prereqReview.getEasinessFactor() >= 2.0;
            });

            if (!allPrereqsMastered) continue;

            // 5. Check if due
            CardReview review = reviewMap.get(card.getId());
            boolean isDue = (review == null)
                    || (review.getNextReviewAt() != null && !review.getNextReviewAt().isAfter(today));

            if (!isDue) continue;

            int intervalDays = (review != null) ? review.getIntervalDays() : 1;
            int repetitions  = (review != null) ? review.getRepetitions()  : 0;

            queue.add(new StudyQueueResponse(
                    card.getId(),
                    card.getFront(),
                    card.getBack(),
                    card.getConceptName(),
                    card.getConceptCategory(),
                    card.getDifficulty(),
                    intervalDays,
                    repetitions
            ));
        }

        return queue;
    }

    /**
     * Submit a review for a card, apply SM-2, and persist.
     */
    @Transactional
    public ReviewResponse submitReview(UUID userId, ReviewRequest request) {
        UUID cardId = request.cardId();
        int rating = request.rating();

        // Load or create card review
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new CardNotFoundException(cardId));

        CardReview review = cardReviewRepository.findByUserIdAndCardId(userId, cardId)
                .orElseGet(() -> {
                    CardReview cr = new CardReview();
                    cr.setUser(user);
                    cr.setCard(card);
                    return cr;
                });

        // Apply SM-2
        Sm2Service.Sm2Result result = sm2Service.calculate(
                rating,
                review.getEasinessFactor(),
                review.getIntervalDays(),
                review.getRepetitions()
        );

        review.setEasinessFactor(result.newEasinessFactor());
        review.setIntervalDays(result.newIntervalDays());
        review.setRepetitions(result.newRepetitions());
        review.setNextReviewAt(result.nextReviewAt());
        review.setLastReviewedAt(Instant.now());

        cardReviewRepository.save(review);

        return new ReviewResponse(
                cardId,
                result.newIntervalDays(),
                result.newEasinessFactor(),
                result.newRepetitions(),
                result.nextReviewAt()
        );
    }
}
EOF

echo "Created SchedulerService.java"

# ─── StudyController.java ─────────────────────────────────────────────────────
cat > src/main/java/com/cuemath/flashcard/study/controller/StudyController.java << 'EOF'
package com.cuemath.flashcard.study.controller;

import com.cuemath.flashcard.study.dto.ReviewRequest;
import com.cuemath.flashcard.study.dto.ReviewResponse;
import com.cuemath.flashcard.study.dto.StudyQueueResponse;
import com.cuemath.flashcard.study.service.SchedulerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/study")
@RequiredArgsConstructor
public class StudyController {

    private final SchedulerService schedulerService;

    @GetMapping("/queue")
    public ResponseEntity<List<StudyQueueResponse>> getQueue(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(schedulerService.buildQueue(userId));
    }

    @PostMapping("/review")
    public ResponseEntity<ReviewResponse> submitReview(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ReviewRequest request) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(schedulerService.submitReview(userId, request));
    }
}
EOF

echo "Created StudyController.java"

# ─── Add CardNotFoundException ────────────────────────────────────────────────
if [ ! -f src/main/java/com/cuemath/flashcard/exception/CardNotFoundException.java ]; then
cat > src/main/java/com/cuemath/flashcard/exception/CardNotFoundException.java << 'EOF'
package com.cuemath.flashcard.exception;

import java.util.UUID;

public class CardNotFoundException extends RuntimeException {
    public CardNotFoundException(UUID id) {
        super("Card not found: " + id);
    }
}
EOF
echo "Created CardNotFoundException.java"
else
  echo "CardNotFoundException.java already exists — skipping"
fi

# ─── Ensure CardDependencyRepository uses correct method name ─────────────────
# The repository was created in Module 2; the method name must match the topology gate usage.
# We patch it only if the correct method is not already present.
if ! grep -q "findByIdCardId" src/main/java/com/cuemath/flashcard/card/repository/CardDependencyRepository.java; then
python3 - << 'PYEOF'
filepath = "src/main/java/com/cuemath/flashcard/card/repository/CardDependencyRepository.java"
with open(filepath, "r") as f:
    content = f.read()
# Replace any existing findByCardId variant with the embedded-id-aware one
import re
content = re.sub(
    r'List<CardDependency> findBy\w+\(UUID cardId\);',
    'List<CardDependency> findByIdCardId(UUID cardId);',
    content
)
with open(filepath, "w") as f:
    f.write(content)
print("Patched CardDependencyRepository: ensured findByIdCardId method")
PYEOF
else
  echo "CardDependencyRepository already has findByIdCardId — skipping"
fi

# ─── Git commit & push ─────────────────────────────────────────────────────────
git add .
git commit -m "feat: Module 3 - SM-2 Scheduler + Prerequisite Gate"
git push origin main

echo ""
echo "================================================================"
echo " Module 3 setup complete!"
echo ""
echo " EXIT CONDITION TO VERIFY:"
echo "   1. GET /api/study/queue — returns cards due for review"
echo "   2. Card with unmastered prereq is ABSENT from queue"
echo "   3. POST /api/study/review {cardId, rating:5} twice on prereq"
echo "      → dependent card APPEARS in queue on next GET"
echo "   4. SM-2 intervals: rating=5 twice → intervalDays=6"
echo "================================================================"
