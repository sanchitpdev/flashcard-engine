package com.cuemath.flashcard.deck.entity;

import com.cuemath.flashcard.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "decks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Deck {

    @Id
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "source_filename", length = 255)
    private String sourceFilename;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DeckStatus status;

    // PDF stored as bytes directly in Postgres — survives redeploys, no extra service needed
    @Column(name = "pdf_data", columnDefinition = "BYTEA")
    private byte[] pdfData;

    @Column(name = "pdf_generated_at")
    private Instant pdfGeneratedAt;

    @PrePersist
    void prePersist() {
        this.createdAt = Instant.now();
        if (this.status == null) this.status = DeckStatus.PROCESSING;
    }

    public enum DeckStatus {
        PROCESSING, READY, FAILED
    }
}
