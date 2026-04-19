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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/decks")
@RequiredArgsConstructor
public class DeckController {

    private final DeckService deckService;
    private final DeckUploadRateLimiter rateLimiter;

    @GetMapping
    public ResponseEntity<List<DeckSummaryResponse>> listDecks(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(deckService.listDecks(uuid(userDetails)));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DeckResponse> createDeck(@AuthenticationPrincipal UserDetails userDetails,
                                                    @RequestParam("file") MultipartFile file) {
        // Size guard (belt-and-suspenders beyond multipart config)
        if (file.getSize() > 10L * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds 10 MB limit.");
        }
        // Content-type guard
        String ct = file.getContentType();
        if (ct == null || !ct.equals("application/pdf")) {
            throw new IllegalArgumentException("Only PDF files are accepted.");
        }
        // Rate limit
        rateLimiter.consume(UUID.fromString(userDetails.getUsername()));

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

    private UUID uuid(UserDetails u) { return UUID.fromString(u.getUsername()); }

    private void validatePdf(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new IllegalArgumentException("No file provided");
        String name = file.getOriginalFilename();
        if (name == null || !name.toLowerCase().endsWith(".pdf"))
            throw new IllegalArgumentException("Only PDF files are accepted");
    }
}
