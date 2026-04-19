package com.cuemath.flashcard.progress.service;

import com.cuemath.flashcard.card.entity.Card;
import com.cuemath.flashcard.card.repository.CardRepository;
import com.cuemath.flashcard.deck.entity.Deck;
import com.cuemath.flashcard.deck.repository.DeckRepository;
import com.cuemath.flashcard.exception.DeckNotFoundException;
import com.cuemath.flashcard.progress.dto.CardMasteryDto;
import com.cuemath.flashcard.progress.dto.DeckProgressResponse;
import com.cuemath.flashcard.progress.dto.ProgressSummaryResponse;
import com.cuemath.flashcard.study.entity.CardReview;
import com.cuemath.flashcard.study.repository.CardReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final DeckRepository deckRepository;
    private final CardRepository cardRepository;
    private final CardReviewRepository cardReviewRepository;

    /**
     * Mastery thresholds:
     *   mastered : repetitions >= 3 AND easinessFactor >= 2.1
     *   shaky    : repetitions >= 1 AND easinessFactor < 2.1
     *   new      : no card_review row for this user+card
     *   due_today: next_review_at <= today
     */
    private String computeMastery(CardReview review) {
        if (review == null) return "new";
        if (review.getRepetitions() >= 3 && review.getEasinessFactor() >= 2.1) return "mastered";
        if (review.getRepetitions() >= 1) return "shaky";
        return "new";
    }

    private boolean isDueToday(CardReview review) {
        if (review == null) return true; // never studied → due
        if (review.getNextReviewAt() == null) return true;
        return !review.getNextReviewAt().isAfter(LocalDate.now());
    }

    @Transactional(readOnly = true)
    public ProgressSummaryResponse getSummary(UUID userId) {
        List<Deck> readyDecks = deckRepository.findByUserIdAndStatus(userId, Deck.DeckStatus.READY);
        if (readyDecks.isEmpty()) return new ProgressSummaryResponse(0, 0, 0, 0, 0);

        List<UUID> deckIds = readyDecks.stream().map(Deck::getId).toList();
        List<Card> cards = cardRepository.findByDeckIdIn(deckIds);

        Map<UUID, CardReview> reviewMap = cardReviewRepository.findByUserId(userId)
                .stream()
                .collect(Collectors.toMap(cr -> cr.getCard().getId(), cr -> cr));

        int mastered = 0, shaky = 0, newCards = 0, dueToday = 0;

        for (Card card : cards) {
            CardReview review = reviewMap.get(card.getId());
            String level = computeMastery(review);
            switch (level) {
                case "mastered" -> mastered++;
                case "shaky"    -> shaky++;
                default         -> newCards++;
            }
            if (isDueToday(review)) dueToday++;
        }

        return new ProgressSummaryResponse(cards.size(), mastered, shaky, newCards, dueToday);
    }

    @Transactional(readOnly = true)
    public DeckProgressResponse getDeckProgress(UUID deckId, UUID userId) {
        Deck deck = deckRepository.findByIdAndUserId(deckId, userId)
                .orElseThrow(() -> new DeckNotFoundException(deckId));

        List<Card> cards = cardRepository.findByDeckId(deckId);

        Map<UUID, CardReview> reviewMap = cardReviewRepository.findByUserId(userId)
                .stream()
                .collect(Collectors.toMap(cr -> cr.getCard().getId(), cr -> cr));

        int mastered = 0, shaky = 0, newCards = 0, dueToday = 0;
        List<CardMasteryDto> cardDtos = new ArrayList<>();

        for (Card card : cards) {
            CardReview review = reviewMap.get(card.getId());
            String level = computeMastery(review);
            LocalDate nextReview = (review != null) ? review.getNextReviewAt() : null;

            switch (level) {
                case "mastered" -> mastered++;
                case "shaky"    -> shaky++;
                default         -> newCards++;
            }
            if (isDueToday(review)) dueToday++;

            cardDtos.add(new CardMasteryDto(card.getId(), card.getConceptName(), level, nextReview));
        }

        return new DeckProgressResponse(
                deck.getId(),
                deck.getTitle(),
                cards.size(),
                mastered,
                shaky,
                newCards,
                dueToday,
                cardDtos
        );
    }
}
