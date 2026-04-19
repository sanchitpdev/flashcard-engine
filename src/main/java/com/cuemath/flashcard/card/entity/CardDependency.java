package com.cuemath.flashcard.card.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "card_dependencies")
@Getter
@Setter
@NoArgsConstructor
public class CardDependency {

    @EmbeddedId
    private CardDependencyId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("cardId")
    @JoinColumn(name = "card_id")
    private Card card;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("requiresCardId")
    @JoinColumn(name = "requires_card_id")
    private Card requiresCard;
}
