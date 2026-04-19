package com.cuemath.flashcard.deck.service;

import com.cuemath.flashcard.auth.entity.User;
import com.cuemath.flashcard.auth.repository.UserRepository;
import com.cuemath.flashcard.deck.dto.DeckResponse;
import com.cuemath.flashcard.deck.dto.DeckSummaryResponse;
import com.cuemath.flashcard.deck.entity.Deck;
import com.cuemath.flashcard.deck.entity.Deck.DeckStatus;
import com.cuemath.flashcard.deck.repository.DeckRepository;
import com.cuemath.flashcard.exception.DeckNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeckService {

    private final DeckRepository deckRepository;
    private final UserRepository userRepository;
    private final PdfExtractionService pdfExtractionService;

    @Transactional(readOnly = true)
    public List<DeckSummaryResponse> listDecks(UUID userId) {
        return deckRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(DeckSummaryResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public DeckResponse getDeck(UUID deckId, UUID userId) {
        return DeckResponse.from(deckRepository.findByIdAndUserId(deckId, userId)
                .orElseThrow(() -> new DeckNotFoundException(deckId)));
    }

    @Transactional
    public DeckResponse createDeck(UUID userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + userId));

        String originalFilename = file.getOriginalFilename();
        Deck deck = Deck.builder()
                .user(user)
                .title(deriveTitle(originalFilename))
                .sourceFilename(originalFilename)
                .status(DeckStatus.PROCESSING)
                .build();

        deck = deckRepository.save(deck);
        log.info("Deck {} created with status PROCESSING", deck.getId());
        processDeckAsync(deck.getId(), file);
        return DeckResponse.from(deck);
    }

    @Async("taskExecutor")
    public void processDeckAsync(UUID deckId, MultipartFile file) {
        log.info("Starting async PDF processing for deck {}", deckId);
        try {
            String extractedText = pdfExtractionService.extractText(file);
            log.info("Extracted {} chars from PDF for deck {}", extractedText.length(), deckId);
            // Module 2 will call CardGenerationService here
            updateDeckStatus(deckId, DeckStatus.READY);
            log.info("Deck {} marked READY", deckId);
        } catch (Exception e) {
            log.error("PDF processing failed for deck {}", deckId, e);
            updateDeckStatus(deckId, DeckStatus.FAILED);
        }
    }

    @Transactional
    public void updateDeckStatus(UUID deckId, DeckStatus status) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new IllegalStateException("Deck not found: " + deckId));
        deck.setStatus(status);
        deckRepository.save(deck);
    }

    @Transactional
    public void deleteDeck(UUID deckId, UUID userId) {
        Deck deck = deckRepository.findByIdAndUserId(deckId, userId)
                .orElseThrow(() -> new DeckNotFoundException(deckId));
        deckRepository.delete(deck);
        log.info("Deck {} deleted by user {}", deckId, userId);
    }

    private String deriveTitle(String filename) {
        if (filename == null || filename.isBlank()) return "Untitled Deck";
        String name = filename.toLowerCase().endsWith(".pdf")
                ? filename.substring(0, filename.length() - 4) : filename;
        return name.replace("_", " ").replace("-", " ").strip();
    }
}
