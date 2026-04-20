package com.cuemath.flashcard.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Central AI gateway with automatic fallback.
 * * Logic:
 * 1. Primary: Uses the model defined in Environment Variables (gemini-1.5-flash-latest).
 * 2. Fallback: Uses a hardcoded stable model (gemini-1.5-flash).
 * * Uses the stable /v1/ API endpoint and forces JSON output via generationConfig.
 */
@Service
@Slf4j
public class AiService {

    private final RestClient geminiRestClient;
    private final ObjectMapper objectMapper;
    private final String geminiApiKey;

    @Value("${gemini.api.model:gemini-1.5-flash-latest}")
    private String geminiModel;

    public AiService(
            @Qualifier("geminiRestClient") RestClient geminiRestClient,
            ObjectMapper objectMapper,
            @Qualifier("geminiApiKey")    String geminiApiKey) {
        this.geminiRestClient = geminiRestClient;
        this.objectMapper     = objectMapper;
        this.geminiApiKey     = geminiApiKey;
    }

    /**
     * Entry point for AI calls. Attempts primary model, then falls back on failure.
     */
    public String call(String systemPrompt, String userMessage) {
        try {
            log.debug("Attempting Primary AI ({})...", geminiModel);
            return callGemini(systemPrompt, userMessage);
        } catch (Exception primaryEx) {
            log.warn("Primary AI failed ({}). Retrying with stable fallback...", primaryEx.getMessage());
            try {
                return callGeminiLite(systemPrompt, userMessage);
            } catch (Exception fallbackEx) {
                String msg = String.format(
                        "Critical AI Failure. Primary: [%s] | Fallback: [%s]",
                        primaryEx.getMessage(), fallbackEx.getMessage());
                log.error(msg);
                throw new RuntimeException(msg, fallbackEx);
            }
        }
    }

    private String callGemini(String systemPrompt, String userMessage) {
        Map<String, Object> body = createRequestBody(systemPrompt, userMessage);
        // Use v1 endpoint for production stability
        String uri = "/v1/models/" + geminiModel + ":generateContent?key=" + geminiApiKey;

        String responseJson = geminiRestClient.post()
                .uri(uri)
                .body(body)
                .retrieve()
                .body(String.class);

        return extractAndCleanText(responseJson);
    }

    private String callGeminiLite(String systemPrompt, String userMessage) {
        Map<String, Object> body = createRequestBody(systemPrompt, userMessage);
        // Fallback specifically targets the base stable model
        String uri = "/v1/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

        String responseJson = geminiRestClient.post()
                .uri(uri)
                .body(body)
                .retrieve()
                .body(String.class);

        return extractAndCleanText(responseJson);
    }

    /**
     * Builds the JSON payload for Google AI.
     * Note: Instructions are prepended to the message for maximum compatibility with v1 API.
     */
    private Map<String, Object> createRequestBody(String systemPrompt, String userMessage) {
        String promptWithInstructions = String.format(
                "SYSTEM INSTRUCTIONS:\n%s\n\nUSER CONTENT:\n%s",
                systemPrompt, userMessage
        );

        return Map.of(
                "contents", List.of(
                        Map.of(
                                "role", "user",
                                "parts", List.of(Map.of("text", promptWithInstructions))
                        )
                ),
                "generationConfig", Map.of(
                        "maxOutputTokens", 4096,
                        "temperature", 0.1,
                        "responseMimeType", "application/json"
                )
        );
    }

    /**
     * Extracts text from the response and strips any Markdown code block artifacts.
     */
    private String extractAndCleanText(String responseJson) {
        try {
            JsonNode root = objectMapper.readTree(responseJson);
            String rawText = root.get("candidates").get(0)
                    .get("content").get("parts").get(0)
                    .get("text").asText();

            // Strip out markdown formatting if the model still includes it despite the mimeType setting
            return rawText.replaceAll("(?i)```json", "")
                    .replaceAll("```", "")
                    .trim();
        } catch (Exception e) {
            log.error("Failed to parse AI response. Payload: {}", responseJson);
            throw new RuntimeException("AI JSON extraction failed", e);
        }
    }
}