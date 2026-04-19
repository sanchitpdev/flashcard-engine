package com.cuemath.flashcard.study.controller;

import com.cuemath.flashcard.study.dto.ReviewRequest;
import com.cuemath.flashcard.study.dto.ReviewResponse;
import com.cuemath.flashcard.study.dto.StudyQueueResponse;
import com.cuemath.flashcard.study.service.SchedulerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/study")
@RequiredArgsConstructor
public class StudyController {

    private final SchedulerService schedulerService;

    @GetMapping("/queue")
    public ResponseEntity<List<StudyQueueResponse>> getQueue(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(schedulerService.buildQueue(userId));
    }

    @PostMapping("/review")
    public ResponseEntity<ReviewResponse> submitReview(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ReviewRequest request) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(schedulerService.submitReview(userId, request));
    }
}
