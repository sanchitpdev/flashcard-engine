package com.cuemath.flashcard.study.repository;

import com.cuemath.flashcard.study.entity.MisconceptionLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MisconceptionLogRepository extends JpaRepository<MisconceptionLog, UUID> {
    List<MisconceptionLog> findByUserId(UUID userId);
}
