package com.cuemath.flashcard.deck.service;

import com.cuemath.flashcard.auth.entity.User;
import com.cuemath.flashcard.auth.repository.UserRepository;
import com.cuemath.flashcard.card.entity.Card;
import com.cuemath.flashcard.card.repository.CardRepository;
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

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class DeckService {

    private final DeckRepository deckRepository;
    private final UserRepository userRepository;
    private final PdfExtractionService pdfExtractionService;
    private final CardRepository cardRepository;
    private final FlashcardPdfService flashcardPdfService;

    @Lazy
    @Autowired
    private CardGenerationService cardGenerationService;

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

        self.processDeckAsync(saved.getId(), file);
        return DeckResponse.from(saved);
    }

    @Async("taskExecutor")
    public void processDeckAsync(UUID deckId, MultipartFile file) {
        try {
            String text = pdfExtractionService.extractText(file);
            cardGenerationService.generateCards(deckId, text);
            self.updateDeckStatus(deckId, Deck.DeckStatus.READY);
            // Generate flashcard PDF after deck is ready
            self.generateFlashcardPdf(deckId);
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

    /**
     * Generates a flashcard PDF from the deck's cards and stores bytes in DB.
     * Runs after deck is READY. Non-blocking — called from async thread.
     */
    @Transactional
    public void generateFlashcardPdf(UUID deckId) {
        deckRepository.findById(deckId).ifPresent(deck -> {
            try {
                List<Card> cards = cardRepository.findByDeckId(deckId);
                if (cards.isEmpty()) return;
                byte[] pdfBytes = flashcardPdfService.generate(deck, cards);
                deck.setPdfData(pdfBytes);
                deck.setPdfGeneratedAt(Instant.now());
                deckRepository.save(deck);
                log.info("Flashcard PDF generated for deck {} ({} bytes)", deckId, pdfBytes.length);
            } catch (Exception e) {
                log.error("Failed to generate flashcard PDF for deck {}", deckId, e);
                // Non-fatal — deck stays READY, PDF just won't be available
            }
        });
    }

    @Transactional
    public void deleteDeck(UUID deckId, UUID userId) {
        Deck deck = deckRepository.findByIdAndUserId(deckId, userId)
                .orElseThrow(() -> new DeckNotFoundException(deckId));
        deckRepository.delete(deck);
    }

    /**
     * Returns raw PDF bytes for download. Returns null if not yet generated.
     */
    @Transactional(readOnly = true)
    public byte[] getDeckPdfBytes(UUID deckId, UUID userId) {
        Deck deck = deckRepository.findByIdAndUserId(deckId, userId)
                .orElseThrow(() -> new DeckNotFoundException(deckId));
        return deck.getPdfData();
    }
}
