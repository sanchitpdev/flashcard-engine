package com.cuemath.flashcard.test.entity;

import com.cuemath.flashcard.auth.entity.User;
import com.cuemath.flashcard.deck.entity.Deck;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "test_sessions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TestSession {

    @Id
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "deck_id", nullable = false)
    private Deck deck;

    @Column(nullable = false)
    private int total;

    @Column(nullable = false)
    private int correct;

    @Column(name = "score_pct", nullable = false)
    private double scorePct;

    @Column(name = "taken_at", nullable = false, updatable = false)
    private Instant takenAt;

    @PrePersist
    void prePersist() {
        this.takenAt = Instant.now();
    }
}
