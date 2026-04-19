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
