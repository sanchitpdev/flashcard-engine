package com.cuemath.flashcard.card.entity;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CardDependencyId implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private UUID cardId;
    private UUID requiresCardId;
}
