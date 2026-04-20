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
 * Central AI gateway with automatic fallback:
 *
 * Primary  → Configurable via Env Var (e.g., gemini-1.5-flash-latest)
 * Fallback → Hardcoded stable model (gemini-1.5-flash)
 *
 * Both providers are called from the backend only — keys never reach the browser.
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

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Calls the primary Gemini model. If it fails (quota, 404, etc.),
     * retries with the stable fallback model.
     */
    public String call(String systemPrompt, String userMessage) {
        try {
            log.debug("Calling Gemini Primary: {}", geminiModel);
            return callGemini(systemPrompt, userMessage);
        } catch (Exception primaryEx) {
            log.warn("Primary AI failed ({}). Falling back to stable Gemini-1.5-flash...", primaryEx.getMessage());
            try {
                return callGeminiLite(systemPrompt, userMessage);
            } catch (Exception fallbackEx) {
                String msg = String.format(
                        "All AI attempts failed. Primary: [%s] | Fallback: [%s]",
                        primaryEx.getMessage(), fallbackEx.getMessage());
                log.error(msg);
                throw new RuntimeException(msg, fallbackEx);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private Providers
    // ─────────────────────────────────────────────────────────────────────────

    private String callGemini(String systemPrompt, String userMessage) {
        Map<String, Object> body = createRequestBody(systemPrompt, userMessage);

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

        // Changed v1beta to v1
        String uri = "/v1/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

        String responseJson = geminiRestClient.post()
                .uri(uri)
                .body(body)
                .retrieve()
                .body(String.class);

        return extractAndCleanText(responseJson);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private Map<String, Object> createRequestBody(String systemPrompt, String userMessage) {
        return Map.of(
                "systemInstruction", Map.of(
                        "parts", List.of(Map.of("text", systemPrompt))
                ),
                "contents", List.of(Map.of(
                        "role",  "user",
                        "parts", List.of(Map.of("text", userMessage))
                )),
                "generationConfig", Map.of(
                        "maxOutputTokens", 4096,
                        "temperature",     0.1   // Lower temperature for stricter JSON adherence
                )
        );
    }

    private String extractAndCleanText(String responseJson) {
        try {
            JsonNode root = objectMapper.readTree(responseJson);
            String rawText = root.get("candidates").get(0)
                    .get("content").get("parts").get(0)
                    .get("text").asText();

            // Regex: Case-insensitive removal of ```json and the closing ``` backticks
            return rawText.replaceAll("(?i)```json", "")
                    .replaceAll("```", "")
                    .trim();
        } catch (Exception e) {
            log.error("Failed to extract text from AI response: {}", responseJson);
            throw new RuntimeException("AI response extraction failed", e);
        }
    }
}