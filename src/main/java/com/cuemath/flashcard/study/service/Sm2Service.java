package com.cuemath.flashcard.study.service;

import org.springframework.stereotype.Service;

import java.time.LocalDate;

/**
 * Pure SM-2 algorithm implementation.
 * Stateless — no Spring dependencies beyond @Service.
 */
@Service
public class Sm2Service {

    public record Sm2Result(double newEasinessFactor, int newIntervalDays, int newRepetitions, LocalDate nextReviewAt) {}

    /**
     * Calculate updated SM-2 values.
     *
     * @param quality      response quality 0–5
     * @param easinessFactor current EF (default 2.5)
     * @param intervalDays   current interval in days
     * @param repetitions    number of successful reviews so far
     */
    public Sm2Result calculate(int quality, double easinessFactor, int intervalDays, int repetitions) {
        int newRepetitions;
        int newInterval;
        double newEF = easinessFactor;

        if (quality < 3) {
            // Forget: reset progress
            newRepetitions = 0;
            newInterval = 1;
        } else {
            // Correct response: update EF
            double efDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
            newEF = Math.max(1.3, easinessFactor + efDelta);

            if (repetitions == 0) {
                newInterval = 1;
            } else if (repetitions == 1) {
                newInterval = 6;
            } else {
                newInterval = (int) Math.round(intervalDays * newEF);
            }
            newRepetitions = repetitions + 1;
        }

        LocalDate nextReview = LocalDate.now().plusDays(newInterval);
        return new Sm2Result(newEF, newInterval, newRepetitions, nextReview);
    }
}
