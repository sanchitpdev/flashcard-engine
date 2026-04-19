package com.cuemath.flashcard.study.entity;

import com.cuemath.flashcard.auth.entity.User;
import com.cuemath.flashcard.card.entity.Card;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "misconception_logs")
@Getter
@Setter
@NoArgsConstructor
public class MisconceptionLog {

    @Id
    @UuidGenerator
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    private Card card;

    @Column(name = "selected_distractor", columnDefinition = "TEXT")
    private String selectedDistractor;

    @Column(name = "misconception_type")
    private String misconceptionType;

    @Column(name = "logged_at", nullable = false, updatable = false)
    private Instant loggedAt;

    @PrePersist
    void prePersist() {
        this.loggedAt = Instant.now();
    }
}
