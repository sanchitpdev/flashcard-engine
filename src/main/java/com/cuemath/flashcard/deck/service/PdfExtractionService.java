package com.cuemath.flashcard.deck.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@Slf4j
public class PdfExtractionService {

    private static final int MAX_CHARS = 60_000;

    public String extractText(MultipartFile file) {
        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String text = stripper.getText(document);

            if (text == null || text.isBlank())
                throw new IllegalArgumentException("PDF contains no extractable text. Is it a scanned image?");

            if (text.length() > MAX_CHARS) {
                log.warn("PDF text truncated from {} to {} chars", text.length(), MAX_CHARS);
                text = text.substring(0, MAX_CHARS);
            }
            return text.strip();
        } catch (IOException e) {
            log.error("Failed to extract text from PDF", e);
            throw new IllegalArgumentException("Could not read PDF file: " + e.getMessage(), e);
        }
    }
}
