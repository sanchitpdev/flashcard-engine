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
 *   Primary  → Gemini 2.0 Flash  (free tier: 1 500 req/day, 1M tokens/min)
 *   Fallback → Grok 3 Mini       (free tier: 60 req/min)
 *
 * Both providers are called from the backend only — keys never reach the browser.
 */
@Service
@Slf4j
public class AiService {

    private final RestClient geminiRestClient;
    private final RestClient grokRestClient;
    private final ObjectMapper objectMapper;
    private final String geminiApiKey;

    @Value("${gemini.api.model:gemini-1.5-flash}")
    private String geminiModel;

    @Value("${grok.api.model:grok-3-mini}")
    private String grokModel;

    public AiService(
            @Qualifier("geminiRestClient") RestClient geminiRestClient,
            @Qualifier("grokRestClient")  RestClient grokRestClient,
            ObjectMapper objectMapper,
            @Qualifier("geminiApiKey")    String geminiApiKey) {
        this.geminiRestClient = geminiRestClient;
        this.grokRestClient   = grokRestClient;
        this.objectMapper     = objectMapper;
        this.geminiApiKey     = geminiApiKey;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Calls Gemini first. If it fails for any reason (quota, network, parse error),
     * automatically retries with Grok. Throws only when both providers fail.
     *
     * @param systemPrompt instruction that shapes the model's role / output format
     * @param userMessage  the actual user content (PDF text, concept names, etc.)
     * @return raw text content returned by whichever provider succeeded
     */
    public String call(String systemPrompt, String userMessage) {
        try {
            log.debug("Calling Gemini (primary)...");
            String result = callGemini(systemPrompt, userMessage);
            log.debug("Gemini responded successfully.");
            return result;
        } catch (Exception geminiEx) {
            log.warn("Gemini failed ({}). Falling back to Grok...", geminiEx.getMessage());
            try {
                String result = callGeminiLite(systemPrompt, userMessage);
                log.info("Grok fallback succeeded.");
                return result;
            } catch (Exception grokEx) {
                String msg = String.format(
                        "Both AI providers failed. Gemini: [%s] | Grok: [%s]",
                        geminiEx.getMessage(), grokEx.getMessage());
                log.error(msg);
                throw new RuntimeException(msg, grokEx);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private — Gemini 2.0 Flash
    // ─────────────────────────────────────────────────────────────────────────

    private String callGemini(String systemPrompt, String userMessage) {
        // Gemini uses systemInstruction separately from contents
        Map<String, Object> body = Map.of(
            "systemInstruction", Map.of(
                "parts", List.of(Map.of("text", systemPrompt))
            ),
            "contents", List.of(Map.of(
                "role",  "user",
                "parts", List.of(Map.of("text", userMessage))
            )),
            "generationConfig", Map.of(
                "maxOutputTokens", 4096,
                "temperature",     0.2   // low temp → more deterministic JSON
            )
        );

        // API key is a query-param for Gemini (not a header)
        String uri = "/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiApiKey;

        String responseJson = geminiRestClient.post()
                .uri(uri)
                .body(body)
                .retrieve()
                .body(String.class);

        JsonNode root = parseJson(responseJson);
        String rawText = root.get("candidates").get(0)
                .get("content").get("parts").get(0)
                .get("text").asText();

        // Strip out the Markdown formatting before returning
        String cleanJson = rawText.replace("```json", "")
                .replace("```", "")
                .trim();

        return cleanJson;

    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private — GeminiLite
    // ─────────────────────────────────────────────────────────────────────────

    private String callGeminiLite(String systemPrompt, String userMessage) {
        // Structure the exact same payload Google expects
        Map<String, Object> body = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", systemPrompt))),
                "contents", List.of(Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text", userMessage))
                )),
                "generationConfig", Map.of("maxOutputTokens", 4096)
        );

        // Hardcode the fallback to use the Lite model
        String uri = "/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" + geminiApiKey;

        // We reuse the existing geminiRestClient since it's the same base URL
        String responseJson = geminiRestClient.post()
                .uri(uri)
                .body(body)
                .retrieve()
                .body(String.class);

        JsonNode root = parseJson(responseJson);
        String rawText = root.get("candidates").get(0)
                .get("content").get("parts").get(0)
                .get("text").asText();

        // Strip out the Markdown formatting before returning
        String cleanJson = rawText.replace("```json", "")
                .replace("```", "")
                .trim();

        return cleanJson;
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private JsonNode parseJson(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse AI provider JSON response: " + e.getMessage(), e);
        }
    }
}
