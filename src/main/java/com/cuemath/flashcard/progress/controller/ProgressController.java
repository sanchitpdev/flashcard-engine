package com.cuemath.flashcard.progress.controller;

import com.cuemath.flashcard.progress.dto.DeckProgressResponse;
import com.cuemath.flashcard.progress.dto.ProgressSummaryResponse;
import com.cuemath.flashcard.progress.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    @GetMapping("/summary")
    public ResponseEntity<ProgressSummaryResponse> getSummary(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(progressService.getSummary(userId));
    }

    @GetMapping("/deck/{id}")
    public ResponseEntity<DeckProgressResponse> getDeckProgress(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(progressService.getDeckProgress(id, userId));
    }
}
