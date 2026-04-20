package com.cuemath.flashcard.test.controller;

import com.cuemath.flashcard.auth.repository.UserRepository;
import com.cuemath.flashcard.test.dto.*;
import com.cuemath.flashcard.test.service.TestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class TestController {

    private final TestService testService;
    private final UserRepository userRepository;

    /** GET /api/decks/{id}/test */
    @GetMapping("/api/decks/{id}/test")
    public ResponseEntity<TestQuestionsResponse> getTest(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(testService.buildQuestions(id, userId(userDetails)));
    }

    /** POST /api/decks/{id}/test/submit */
    @PostMapping("/api/decks/{id}/test/submit")
    public ResponseEntity<TestResultResponse> submitTest(
            @PathVariable UUID id,
            @RequestBody SubmitTestRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        SubmitTestRequest req = new SubmitTestRequest(id, request.answers());
        return ResponseEntity.ok(testService.submitTest(userId(userDetails), req));
    }

    /** GET /api/test/history */
    @GetMapping("/api/test/history")
    public ResponseEntity<List<TestHistoryItem>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(testService.getHistory(userId(userDetails)));
    }

    private UUID userId(UserDetails u) {
        return userRepository.findByEmail(u.getUsername())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"))
                .getId();
    }
}
