package com.codevision.javabackend.controller;

import com.codevision.javabackend.model.*;
import com.codevision.javabackend.service.JavaAnalyzerService;
import com.codevision.javabackend.service.JavaExecutorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller exposing the Java analysis and execution APIs.
 *
 * POST /analyze-java  — Extracts OOP concepts, classes, objects, etc.
 * POST /execute-java  — Interprets simplified Java code step-by-step.
 */
@RestController
public class JavaController {

    private final JavaAnalyzerService analyzerService;
    private final JavaExecutorService executorService;

    public JavaController(JavaAnalyzerService analyzerService,
                          JavaExecutorService executorService) {
        this.analyzerService = analyzerService;
        this.executorService = executorService;
    }

    // ── Health & Info ──────────────────────────────────────────────────

    @GetMapping("/")
    public Map<String, String> root() {
        return Map.of(
            "message", "CodeVision Java Backend is running",
            "version", "1.0.0"
        );
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
            "status", "healthy",
            "service", "CodeVision Java Backend"
        );
    }

    // ── Analyze Java Code ─────────────────────────────────────────────

    @PostMapping("/analyze-java")
    public ResponseEntity<?> analyzeJava(@RequestBody AnalyzeRequest request) {
        if (request.getCode() == null || request.getCode().isBlank()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Code cannot be empty"));
        }
        if (request.getCode().length() > 20_000) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Code is too long (max 20,000 characters)"));
        }

        try {
            AnalyzeResponse response = analyzerService.analyze(request.getCode());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", e.getMessage()));
        }
    }

    // ── Execute Java Code ─────────────────────────────────────────────

    @PostMapping("/execute-java")
    public ResponseEntity<?> executeJava(@RequestBody ExecuteRequest request) {
        if (request.getCode() == null || request.getCode().isBlank()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Code cannot be empty"));
        }
        if (request.getCode().length() > 10_000) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Code is too long (max 10,000 characters)"));
        }

        try {
            ExecuteResponse response = executorService.execute(request.getCode());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", e.getMessage()));
        }
    }
}
