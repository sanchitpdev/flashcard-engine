package com.cuemath.flashcard.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AiService {

    private final RestClient geminiRestClient;
    private final ObjectMapper objectMapper;
    private final String geminiApiKey;

    // The verified fallback chain using exact names from your API list
    private final String[] modelChain = {
            "gemini-2.5-flash-lite",      // 1st: The most stable, lightweight, high-availability model
            "gemini-flash-lite-latest",   // 2nd: The auto-updating alias for the lite model
            "gemini-2.5-flash"            // 3rd: The standard mid-size model as a final safety net
    };

    public AiService(
            @Qualifier("geminiRestClient") RestClient geminiRestClient,
            ObjectMapper objectMapper,
            @Qualifier("geminiApiKey") String geminiApiKey) {
        this.geminiRestClient = geminiRestClient;
        this.objectMapper = objectMapper;
        this.geminiApiKey = geminiApiKey;
    }

    public String call(String systemPrompt, String userMessage) {

        // Embed the JSON requirement directly into the prompt
        String combinedPrompt = systemPrompt + "\n\nCRITICAL: Return ONLY a raw JSON array. No markdown, no conversational text.\n\n" + userMessage;

        // The absolute bare-minimum JSON structure Google accepts
        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", combinedPrompt)
                        ))
                )
        );

        // Loop through the verified models until one successfully responds
        for (String model : modelChain) {
            try {
                log.info("Attempting generation with model: {}", model);
                String uri = "/v1/models/" + model + ":generateContent?key=" + geminiApiKey;

                String responseJson = geminiRestClient.post()
                        .uri(uri)
                        .body(body)
                        .retrieve()
                        .body(String.class);

                log.info("Success! Generated response using {}", model);
                return extractAndCleanText(responseJson);

            } catch (Exception e) {
                log.warn("Model {} failed ({}). Trying next available model...", model, e.getMessage());
            }
        }

        throw new RuntimeException("CRITICAL: All verified AI models in the fallback chain failed.");
    }

    private String extractAndCleanText(String responseJson) {
        try {
            JsonNode root = objectMapper.readTree(responseJson);
            String rawText = root.get("candidates").get(0)
                    .get("content").get("parts").get(0)
                    .get("text").asText();

            // Strip any markdown backticks the AI tries to sneak in
            return rawText.replaceAll("(?i)```json", "")
                    .replaceAll("```", "")
                    .trim();
        } catch (Exception e) {
            log.error("Failed to parse the AI's response format.");
            throw new RuntimeException("JSON parsing failed", e);
        }
    }
}