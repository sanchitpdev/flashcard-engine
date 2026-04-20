package com.cuemath.flashcard.deck.controller;

import com.cuemath.flashcard.deck.dto.DeckResponse;
import com.cuemath.flashcard.deck.dto.DeckSummaryResponse;
import com.cuemath.flashcard.deck.service.DeckService;
import com.cuemath.flashcard.ratelimit.DeckUploadRateLimiter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.cuemath.flashcard.auth.repository.UserRepository;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/decks")
@RequiredArgsConstructor
public class DeckController {

    private final DeckService deckService;
    private final DeckUploadRateLimiter rateLimiter;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<DeckSummaryResponse>> listDecks(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(deckService.listDecks(uuid(userDetails)));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DeckResponse> createDeck(@AuthenticationPrincipal UserDetails userDetails,
                                                    @RequestParam("file") MultipartFile file) {
        if (file.getSize() > 10L * 1024 * 1024)
            throw new IllegalArgumentException("File size exceeds 10 MB limit.");
        String ct = file.getContentType();
        if (ct == null || !ct.equals("application/pdf"))
            throw new IllegalArgumentException("Only PDF files are accepted.");
        rateLimiter.consume(uuid(userDetails));
        validatePdf(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(deckService.createDeck(uuid(userDetails), file));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeckResponse> getDeck(@AuthenticationPrincipal UserDetails userDetails,
                                                 @PathVariable UUID id) {
        return ResponseEntity.ok(deckService.getDeck(id, uuid(userDetails)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDeck(@AuthenticationPrincipal UserDetails userDetails,
                                            @PathVariable UUID id) {
        deckService.deleteDeck(id, uuid(userDetails));
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/decks/{id}/pdf
     * Streams the generated flashcard PDF for download.
     */
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@AuthenticationPrincipal UserDetails userDetails,
                                               @PathVariable UUID id) {
        byte[] pdfBytes = deckService.getDeckPdfBytes(id, uuid(userDetails));
        if (pdfBytes == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        // Fetch deck title for filename
        var deck = deckService.getDeck(id, uuid(userDetails));
        String filename = deck.title().replaceAll("[^a-zA-Z0-9_\\-]", "_") + "_flashcards.pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentLength(pdfBytes.length)
                .body(pdfBytes);
    }

    private UUID uuid(UserDetails u) {
        return userRepository.findByEmail(u.getUsername())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"))
                .getId();
    }

    private void validatePdf(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new IllegalArgumentException("No file provided");
        String name = file.getOriginalFilename();
        if (name == null || !name.toLowerCase().endsWith(".pdf"))
            throw new IllegalArgumentException("Only PDF files are accepted");
    }
}
