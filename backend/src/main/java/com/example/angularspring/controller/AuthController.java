package com.example.angularspring.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.angularspring.dto.AuthRequest;
import com.example.angularspring.model.RefreshToken;
import com.example.angularspring.model.User;
import com.example.angularspring.repository.RefreshTokenRepository;
import com.example.angularspring.repository.UserRepository;
import com.example.angularspring.security.JwtUtil;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtUtil jwtUtil;
	private final RefreshTokenRepository refreshTokenRepository;

	public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil,
			RefreshTokenRepository refreshTokenRepository) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtUtil = jwtUtil;
		this.refreshTokenRepository = refreshTokenRepository;
	}

	@PostMapping("/signup")
	public ResponseEntity<?> signup(@RequestBody AuthRequest request) {
		// TODO : validate each fields
		if (userRepository.findByUsername(request.getUsername()).isPresent()) {
			return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
		}
		User user = new User();
		user.setUsername(request.getUsername());
		user.setEmail(request.getEmail());
		user.setMobile(request.getMobile());
		user.setPassword(passwordEncoder.encode(request.getPassword()));
		userRepository.save(user);
		return ResponseEntity.ok(Map.of("message", "User registered successfully"));
	}

	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody AuthRequest request) {
		User user = userRepository.findByEmail(request.getEmail()).orElse(null);

		if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
			return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
		}

		String accessToken = jwtUtil.generateAccessToken(user.getUsername());
		RefreshToken refreshToken = jwtUtil.createRefreshToken(user.getUsername());

		return ResponseEntity.ok(Map.of("username", user.getUsername(), "accessToken", accessToken, "refreshToken", refreshToken.getToken()));
	}

	@PostMapping("/refresh")
	public ResponseEntity<?> refresh(@RequestBody Map<String, String> request) {
		String requestRefreshToken = request.get("refreshToken");

		return refreshTokenRepository.findByToken(requestRefreshToken).map(jwtUtil::verifyExpiration)
				.map(RefreshToken::getUser).map(user -> {
					String token = jwtUtil.generateAccessToken(user.getUsername());
					return ResponseEntity.ok(Map.of("username", user.getUsername(), "accessToken", token, "refreshToken", requestRefreshToken));
				})
				.orElseGet(() -> ResponseEntity.status(403).body(Map.of("error", "Refresh token is not in database!")));
	}

	@PostMapping("/logout")
	public ResponseEntity<?> logout(@RequestBody Map<String, String> request) {
		String requestRefreshToken = request.get("refreshToken");

		refreshTokenRepository.findByToken(requestRefreshToken).ifPresent(token -> {
			jwtUtil.deleteByUsername(token.getUser().getUsername());
		});

		return ResponseEntity.ok(Map.of("message", "Log out successful. Refresh token revoked."));
	}
}