package com.cuemath.flashcard.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * Configures REST clients for both AI providers:
 *   - Gemini 2.0 Flash  (primary  — free tier, Google)
 *   - Grok 3 Mini       (fallback — free tier, xAI)
 */
@Configuration
public class AiApiConfig {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    /** RestClient pointed at Google's Generative Language API. */
    @Bean("geminiRestClient")
    public RestClient geminiRestClient() {
        return RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    /**
     * Expose the Gemini key as a named bean so AiService can inject it
     * cleanly without needing another @Value inside the service itself.
     */
    @Bean("geminiApiKey")
    public String geminiApiKey() {
        return geminiApiKey;
    }
}
