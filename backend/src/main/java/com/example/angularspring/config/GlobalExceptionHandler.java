package com.example.angularspring.config;

import java.util.HashMap;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Handles Database Constraint Violations (e.g., Duplicate Email, Duplicate
    // Username, or CHAR(10) Data Truncation)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolation(
            DataIntegrityViolationException ex) {
        String errorMessage = "Database conflict error.";
        String rootMsg =
                ex.getRootCause() != null ? ex.getRootCause().getMessage() : ex.getMessage();

        // Dynamically customize response message based on MySQL error messages
        if (rootMsg != null) {
            if (rootMsg.contains("Duplicate entry")) {
                if (rootMsg.contains("username")) {
                    errorMessage = "Username is already taken.";
                } else if (rootMsg.contains("email")) {
                    errorMessage = "Email address is already registered.";
                } else if (rootMsg.contains("mobile")) {
                    errorMessage = "Mobile number is already linked to an account.";
                } else {
                    errorMessage = "Duplicate record already exists.";
                }
            } else if (rootMsg.contains("Data too long") || rootMsg.contains("truncation")) {
                errorMessage =
                        "Invalid input length. Ensure the mobile number is exactly 10 digits.";
            }
        }

        return ResponseEntity.status(HttpStatus.CONFLICT) // 409 Conflict
                .body(Map.of("error", errorMessage));
    }

    // 2. Handles JSR 303/Jakarta Field Validation Violations (e.g., @NotBlank,
    // @Email annotations on DTOs)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult()
                .getFieldErrors()
                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));

        return ResponseEntity.status(HttpStatus.BAD_REQUEST) // 400 Bad Request
                .body(Map.of("error", "Validation failed", "details", errors));
    }

    // 3. Handles Wrong HTTP Methods (e.g., hitting a POST endpoint with GET)
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, String>> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED) // 405 Method Not Allowed
                .body(
                        Map.of(
                                "error",
                                String.format(
                                        "HTTP method '%s' is not supported for this path.",
                                        ex.getMethod())));
    }

    // 4. Handles 404 Not Found Exceptions (e.g., trying to access an invalid
    // endpoint string)
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(NoResourceFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND) // 404 Not Found
                .body(Map.of("error", "The requested API endpoint does not exist."));
    }

    // 5. Catch-All for any Unexpected System Failures (5xx errors)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGlobalException(Exception ex) {
        // Print the real stack trace in your IDE terminal console so you can debug
        // easily
        ex.printStackTrace();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR) // 500 Server Error
                .body(
                        Map.of(
                                "error",
                                "An unexpected server error occurred. Please try again later."));
    }
}
