package com.cuemath.flashcard;

import com.cuemath.flashcard.config.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(JwtProperties.class)
public class FlashcardEngineApplication {
    public static void main(String[] args) {
        SpringApplication.run(FlashcardEngineApplication.class, args);
    }
}
