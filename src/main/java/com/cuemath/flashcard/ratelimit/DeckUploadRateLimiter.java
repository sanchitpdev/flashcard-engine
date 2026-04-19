package com.cuemath.flashcard.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory rate limiter: max 5 PDF uploads per user per hour.
 */
@Service
public class DeckUploadRateLimiter {

    private final Map<UUID, Bucket> buckets = new ConcurrentHashMap<>();

    private Bucket newBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(5)
                .refillIntervally(5, Duration.ofHours(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    /**
     * @throws RateLimitExceededException if the user has exhausted their upload quota
     */
    public void consume(UUID userId) {
        Bucket bucket = buckets.computeIfAbsent(userId, id -> newBucket());
        if (!bucket.tryConsume(1)) {
            throw new RateLimitExceededException(
                    "Upload limit reached: max 5 PDF uploads per hour. Please try again later.");
        }
    }
}
