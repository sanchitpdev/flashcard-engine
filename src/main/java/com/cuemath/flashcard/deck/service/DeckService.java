package com.cuemath.flashcard.deck.service;

import com.cuemath.flashcard.auth.entity.User;
import com.cuemath.flashcard.auth.repository.UserRepository;
import com.cuemath.flashcard.card.service.CardGenerationService;
import com.cuemath.flashcard.deck.dto.DeckResponse;
import com.cuemath.flashcard.deck.dto.DeckSummaryResponse;
import com.cuemath.flashcard.deck.entity.Deck;
import com.cuemath.flashcard.deck.repository.DeckRepository;
import com.cuemath.flashcard.exception.DeckNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class DeckService {

    private final DeckRepository deckRepository;
    private final UserRepository userRepository;
    private final PdfExtractionService pdfExtractionService;

    /**
     * @Lazy breaks the potential CardGenerationService → DeckRepository ← DeckService cycle.
     * Field injection is used here because @RequiredArgsConstructor would pick up @Lazy only
     * if combined with a custom constructor — setter/field with @Lazy is simpler.
     */
    @Lazy
    @Autowired
    private CardGenerationService cardGenerationService;

    /**
     * Self-injection through the Spring proxy so that calling processDeckAsync() from
     * createDeck() actually goes through the AOP proxy and the @Async advice fires.
     * Without this, the @Async annotation on processDeckAsync would be ignored for
     * internal calls.
     */
    @Lazy
    @Autowired
    private DeckService self;

    // ─────────────────────────────────────────────────────────────────────────

    public List<DeckSummaryResponse> listDecks(UUID userId) {
        return deckRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(DeckSummaryResponse::from)
                .toList();
    }

    public DeckResponse getDeck(UUID deckId, UUID userId) {
        Deck deck = deckRepository.findByIdAndUserId(deckId, userId)
                .orElseThrow(() -> new DeckNotFoundException(deckId));
        return DeckResponse.from(deck);
    }

    @Transactional
    public DeckResponse createDeck(UUID userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        String originalFilename = file.getOriginalFilename();
        String title = (originalFilename != null)
                ? originalFilename.replaceAll("(?i)\\.pdf$", "")
                : "Untitled";

        Deck deck = new Deck();
        deck.setUser(user);
        deck.setTitle(title);
        deck.setSourceFilename(originalFilename);
        deck.setStatus(Deck.DeckStatus.PROCESSING);
        Deck saved = deckRepository.save(deck);

        // Call through `self` so the @Async proxy intercepts the invocation
        self.processDeckAsync(saved.getId(), file);
        return DeckResponse.from(saved);
    }

    @Async("taskExecutor")
    public void processDeckAsync(UUID deckId, MultipartFile file) {
        try {
            String text = pdfExtractionService.extractText(file);
            cardGenerationService.generateCards(deckId, text);
            // Call through self so @Transactional on updateDeckStatus is honoured
            self.updateDeckStatus(deckId, Deck.DeckStatus.READY);
        } catch (Exception e) {
            log.error("Failed to process deck {}", deckId, e);
            self.updateDeckStatus(deckId, Deck.DeckStatus.FAILED);
        }
    }

    @Transactional
    public void updateDeckStatus(UUID deckId, Deck.DeckStatus status) {
        deckRepository.findById(deckId).ifPresent(deck -> {
            deck.setStatus(status);
            deckRepository.save(deck);
        });
    }

    @Transactional
    public void deleteDeck(UUID deckId, UUID userId) {
        Deck deck = deckRepository.findByIdAndUserId(deckId, userId)
                .orElseThrow(() -> new DeckNotFoundException(deckId));
        deckRepository.delete(deck);
    }
}
