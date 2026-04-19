package com.cuemath.flashcard.card.service;

import com.cuemath.flashcard.ai.AiService;
import com.cuemath.flashcard.card.entity.Card;
import com.cuemath.flashcard.card.entity.CardDependency;
import com.cuemath.flashcard.card.entity.CardDependencyId;
import com.cuemath.flashcard.card.repository.CardDependencyRepository;
import com.cuemath.flashcard.card.repository.CardRepository;
import com.cuemath.flashcard.deck.entity.Deck;
import com.cuemath.flashcard.deck.repository.DeckRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class CardGenerationService {

    // ── System prompts ────────────────────────────────────────────────────────
    private static final String CARD_GEN_SYSTEM =
            "You are an expert educator and instructional designer. Generate high-quality " +
            "flashcards from educational text. Rules: Each card tests understanding not just " +
            "recall. Cover key definitions, conceptual relationships, common misconceptions, " +
            "worked examples. Assign concept_name as a short unique label. Assign " +
            "concept_category: one of [definition, relationship, procedure, example, " +
            "misconception]. Assign difficulty: 1=foundational, 2=intermediate, 3=advanced. " +
            "Return ONLY valid JSON, no preamble, no markdown fences. " +
            "Schema: {\"cards\":[{\"front\":\"str\",\"back\":\"str\",\"concept_name\":\"str\"," +
            "\"concept_category\":\"str\",\"difficulty\":1}]}";

    private static final String DEP_SYSTEM =
            "You are an expert in knowledge graph construction for education. Given concept " +
            "names from flashcards, identify prerequisite relationships. Rules: A prerequisite " +
            "means a student cannot correctly understand concept B without first understanding " +
            "concept A. Only include HIGH-CONFIDENCE relationships. Do not invent relationships " +
            "not present in the concepts. Return ONLY valid JSON, no preamble, no markdown " +
            "fences. Schema: {\"dependencies\":[{\"concept\":\"str\",\"requires\":\"str\"}]} " +
            "where concept needs requires to be mastered first.";

    // ── Dependencies ──────────────────────────────────────────────────────────
    private final AiService aiService;
    private final CardRepository cardRepository;
    private final CardDependencyRepository cardDependencyRepository;
    private final DeckRepository deckRepository;
    private final ObjectMapper objectMapper;

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public void generateCards(UUID deckId, String extractedText) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new RuntimeException("Deck not found: " + deckId));

        // Step 1 — Card generation (Gemini → Grok fallback handled inside AiService)
        List<Card> savedCards = generateAndSaveCards(deck, extractedText);
        if (savedCards.isEmpty()) {
            log.warn("No cards generated for deck {}", deckId);
            return;
        }

        // Step 2 — Dependency extraction (failures are non-fatal)
        extractAndSaveDependencies(savedCards);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private List<Card> generateAndSaveCards(Deck deck, String text) {
        String userMsg = "Generate flashcards from this text: " + text;
        try {
            String responseText = aiService.call(CARD_GEN_SYSTEM, userMsg);
            JsonNode root = objectMapper.readTree(responseText);
            JsonNode cardsArray = root.get("cards");

            if (cardsArray == null || !cardsArray.isArray()) {
                log.error("Unexpected card-generation response shape for deck {}", deck.getId());
                return List.of();
            }

            List<Card> saved = new ArrayList<>();
            for (JsonNode node : cardsArray) {
                try {
                    Card card = new Card();
                    card.setDeck(deck);
                    card.setFront(node.get("front").asText());
                    card.setBack(node.get("back").asText());
                    card.setConceptName(node.get("concept_name").asText());
                    card.setConceptCategory(node.get("concept_category").asText());
                    card.setDifficulty(node.path("difficulty").asInt(1));
                    saved.add(cardRepository.save(card));
                } catch (Exception e) {
                    log.error("Skipping malformed card node for deck {}: {}", deck.getId(), e.getMessage());
                }
            }
            log.info("Saved {} cards for deck {}", saved.size(), deck.getId());
            return saved;

        } catch (Exception e) {
            log.error("Card generation failed for deck {}", deck.getId(), e);
            return List.of();
        }
    }

    private void extractAndSaveDependencies(List<Card> cards) {
        if (cards.size() < 2) return;

        String conceptNames = cards.stream()
                .map(Card::getConceptName)
                .collect(Collectors.joining(", "));

        String userMsg = "Here are the concept names: " + conceptNames +
                ". Identify prerequisite relationships.";

        try {
            String responseText = aiService.call(DEP_SYSTEM, userMsg);
            JsonNode root = objectMapper.readTree(responseText);
            JsonNode depsArray = root.get("dependencies");

            if (depsArray == null || !depsArray.isArray()) {
                log.warn("No dependency array in response — skipping dependency save");
                return;
            }

            Map<String, Card> conceptToCard = cards.stream()
                    .collect(Collectors.toMap(Card::getConceptName, c -> c, (a, b) -> a));

            int savedCount = 0;
            for (JsonNode depNode : depsArray) {
                try {
                    String concept  = depNode.get("concept").asText();
                    String requires = depNode.get("requires").asText();

                    Card conceptCard  = conceptToCard.get(concept);
                    Card requiresCard = conceptToCard.get(requires);
                    if (conceptCard == null || requiresCard == null) continue;
                    if (conceptCard.getId().equals(requiresCard.getId())) continue;

                    CardDependencyId depId = new CardDependencyId(
                            conceptCard.getId(), requiresCard.getId());
                    CardDependency dep = new CardDependency();
                    dep.setId(depId);
                    dep.setCard(conceptCard);
                    dep.setRequiresCard(requiresCard);
                    cardDependencyRepository.save(dep);
                    savedCount++;
                } catch (Exception e) {
                    log.error("Skipping malformed dependency node: {}", e.getMessage());
                }
            }
            log.info("Saved {} dependencies for {} cards", savedCount, cards.size());

        } catch (Exception e) {
            // Non-fatal — a deck without dependency edges is still usable
            log.error("Dependency extraction failed (non-fatal): {}", e.getMessage());
        }
    }
}
