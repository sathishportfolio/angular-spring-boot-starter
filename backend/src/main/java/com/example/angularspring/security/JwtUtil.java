package com.example.angularspring.security;

import com.example.angularspring.model.RefreshToken;
import com.example.angularspring.repository.RefreshTokenRepository;
import com.example.angularspring.repository.UserRepository;
import com.example.angularspring.model.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    // 0.12.x requires a SecretKey type instead of Key
    private final SecretKey key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
    
    private final long accessTokenExpirationMs = 900000; // 15 Minutes
    private final long refreshTokenExpirationMs = 604800000; // 7 Days

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    public JwtUtil(RefreshTokenRepository refreshTokenRepository, UserRepository userRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
    }

    // --- ACCESS TOKEN METHODS ---
    public String generateAccessToken(String username) {
        return Jwts.builder()
                .subject(username) // 0.12.x syntax change (setSubject -> subject)
                .issuedAt(new Date()) // 0.12.x syntax change (setIssuedAt -> issuedAt)
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpirationMs)) // setExpiration -> expiration
                .signWith(key) // Algorithm is inferred automatically from the key type
                .compact();
    }

    public String getUsernameFromToken(String token) {
        return Jwts.parser()
                .verifyWith(key) // 0.12.x syntax change (setSigningKey -> verifyWith)
                .build()
                .parseSignedClaims(token) // 0.12.x syntax change (parseClaimsJws -> parseSignedClaims)
                .getPayload() // 0.12.x syntax change (getBody -> getPayload)
                .getSubject();
    }

    public boolean validateAccessToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // --- REFRESH TOKEN METHODS ---
    public RefreshToken createRefreshToken(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Delete any existing refresh token for this user to avoid duplication
        refreshTokenRepository.deleteByUser(user);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshTokenExpirationMs));

        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token was expired. Please sign in again.");
        }
        return token;
    }

    @Transactional
    public void deleteByUsername(String username) {
        userRepository.findByUsername(username).ifPresent(refreshTokenRepository::deleteByUser);
    }
}