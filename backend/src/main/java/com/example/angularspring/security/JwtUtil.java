package com.example.angularspring.security;

import com.example.angularspring.model.RefreshToken;
import com.example.angularspring.model.User;
import com.example.angularspring.repository.RefreshTokenRepository;
import com.example.angularspring.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class JwtUtil {

    //    private final SecretKey key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
    private final SecretKey key = Jwts.SIG.HS256.key().build();

    private final long accessTokenExpirationMs = 900000; // 15 Minutes
    private final long refreshTokenExpirationMs = 604800000; // 7 Days

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    public JwtUtil(RefreshTokenRepository refreshTokenRepository, UserRepository userRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
    }

    // --- ACCESS TOKEN METHODS ---
    public String generateAccessToken(User user) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", user.getId());
        extraClaims.put("email", user.getEmail());
        extraClaims.put("mobile", user.getMobile());

        return Jwts.builder()
                .claims(extraClaims)
                .subject(user.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpirationMs))
                .signWith(key)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean validateAccessToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // --- REFRESH TOKEN METHODS ---
    public RefreshToken createRefreshToken(String username) {
        User user =
                userRepository
                        .findByUsername(username)
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
