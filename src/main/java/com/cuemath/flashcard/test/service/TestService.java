package com.cuemath.flashcard.test.service;

import com.cuemath.flashcard.auth.entity.User;
import com.cuemath.flashcard.auth.repository.UserRepository;
import com.cuemath.flashcard.card.entity.Card;
import com.cuemath.flashcard.card.repository.CardRepository;
import com.cuemath.flashcard.deck.entity.Deck;
import com.cuemath.flashcard.deck.repository.DeckRepository;
import com.cuemath.flashcard.exception.DeckNotFoundException;
import com.cuemath.flashcard.study.dto.ReviewRequest;
import com.cuemath.flashcard.study.entity.MisconceptionLog;
import com.cuemath.flashcard.study.repository.CardReviewRepository;
import com.cuemath.flashcard.study.repository.MisconceptionLogRepository;
import com.cuemath.flashcard.study.service.SchedulerService;
import com.cuemath.flashcard.test.dto.*;
import com.cuemath.flashcard.test.entity.TestSession;
import com.cuemath.flashcard.test.repository.TestSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TestService {

    private final DeckRepository deckRepository;
    private final CardRepository cardRepository;
    private final CardReviewRepository cardReviewRepository;
    private final MisconceptionLogRepository misconceptionLogRepository;
    private final TestSessionRepository testSessionRepository;
    private final UserRepository userRepository;
    private final SchedulerService schedulerService;

    /**
     * Build MCQ questions for a deck.
     * Each question: card.front as question, card.back as correct answer,
     * 3 random distractors from other cards' backs in same deck.
     */
    @Transactional(readOnly = true)
    public TestQuestionsResponse buildQuestions(UUID deckId, UUID userId) {
        Deck deck = deckRepository.findByIdAndUserId(deckId, userId)
                .orElseThrow(() -> new DeckNotFoundException(deckId));

        List<Card> cards = cardRepository.findByDeckId(deckId);
        if (cards.size() < 2) {
            throw new IllegalStateException("Deck must have at least 2 cards to take a test.");
        }

        Random rng = new Random();
        List<McqQuestion> questions = new ArrayList<>();

        for (Card card : cards) {
            // Pool of distractors: all other cards' backs
            List<String> pool = cards.stream()
                    .filter(c -> !c.getId().equals(card.getId()))
                    .map(Card::getBack)
                    .collect(Collectors.toCollection(ArrayList::new));

            Collections.shuffle(pool, rng);
            List<String> distractors = pool.stream().limit(3).toList();

            // Build options: correct + 3 distractors, shuffled
            List<String> options = new ArrayList<>(distractors);
            options.add(card.getBack());
            Collections.shuffle(options, rng);

            int correctIndex = options.indexOf(card.getBack());

            questions.add(new McqQuestion(
                    card.getId(),
                    card.getFront(),
                    options,
                    correctIndex
            ));
        }

        Collections.shuffle(questions, rng);
        return new TestQuestionsResponse(questions);
    }

    /**
     * Submit answers:
     * - correct   → submitReview(rating=5) → card stays / turns green
     * - incorrect → submitReview(rating=0) → card turns red
     * - logs wrong answers to misconception_logs
     * - saves a test_session row
     * - returns full result breakdown
     */
    @Transactional
    public TestResultResponse submitTest(UUID userId, SubmitTestRequest request) {
        Deck deck = deckRepository.findByIdAndUserId(request.deckId(), userId)
                .orElseThrow(() -> new DeckNotFoundException(request.deckId()));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Build a cardId → Card map for this deck
        List<Card> deckCards = cardRepository.findByDeckId(request.deckId());
        Map<UUID, Card> cardMap = deckCards.stream()
                .collect(Collectors.toMap(Card::getId, c -> c));

        int total = request.answers().size();
        int correct = 0;

        List<QuestionResult> results = new ArrayList<>();
        Map<String, int[]> catScores = new LinkedHashMap<>(); // category → [correct, total]

        for (AnswerItem answer : request.answers()) {
            Card card = cardMap.get(answer.cardId());
            if (card == null) continue;

            boolean isCorrect = card.getBack().trim().equalsIgnoreCase(
                    answer.selectedAnswer() == null ? "" : answer.selectedAnswer().trim()
            );

            if (isCorrect) {
                correct++;
                schedulerService.submitReview(userId, new ReviewRequest(answer.cardId(), 5));
            } else {
                schedulerService.submitReview(userId, new ReviewRequest(answer.cardId(), 0));

                // Log to misconception_logs
                MisconceptionLog log = new MisconceptionLog();
                log.setUser(user);
                log.setCard(card);
                log.setSelectedDistractor(answer.selectedAnswer());
                log.setMisconceptionType(card.getConceptCategory());
                misconceptionLogRepository.save(log);
            }

            // Category tracking
            String cat = card.getConceptCategory() != null ? card.getConceptCategory() : "unknown";
            catScores.computeIfAbsent(cat, k -> new int[]{0, 0});
            catScores.get(cat)[1]++;
            if (isCorrect) catScores.get(cat)[0]++;

            results.add(new QuestionResult(
                    card.getId(),
                    card.getFront(),
                    card.getBack(),
                    answer.selectedAnswer(),
                    isCorrect,
                    cat
            ));
        }

        double scorePct = total > 0 ? Math.round((correct * 100.0 / total) * 100.0) / 100.0 : 0;

        // Persist test session
        TestSession session = TestSession.builder()
                .user(user)
                .deck(deck)
                .total(total)
                .correct(correct)
                .scorePct(scorePct)
                .build();
        TestSession saved = testSessionRepository.save(session);

        // Category breakdown
        List<CategoryScore> breakdown = catScores.entrySet().stream()
                .map(e -> {
                    int c = e.getValue()[0];
                    int t = e.getValue()[1];
                    double pct = t > 0 ? Math.round((c * 100.0 / t) * 100.0) / 100.0 : 0;
                    return new CategoryScore(e.getKey(), c, t, pct);
                })
                .toList();

        return new TestResultResponse(saved.getId(), total, correct, scorePct, results, breakdown);
    }

    /**
     * Return test history for a user across all decks (or filtered by deck).
     */
    @Transactional(readOnly = true)
    public List<TestHistoryItem> getHistory(UUID userId) {
        return testSessionRepository.findByUserIdOrderByTakenAtDesc(userId)
                .stream()
                .map(s -> new TestHistoryItem(
                        s.getId(),
                        s.getDeck().getId(),
                        s.getDeck().getTitle(),
                        s.getTotal(),
                        s.getCorrect(),
                        s.getScorePct(),
                        s.getTakenAt()
                ))
                .toList();
    }
}
