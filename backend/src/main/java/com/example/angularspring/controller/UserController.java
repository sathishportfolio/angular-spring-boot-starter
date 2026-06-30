package com.example.angularspring.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.angularspring.model.User;
import com.example.angularspring.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
	}

	// 1. Create User
	@PostMapping
	public ResponseEntity<?> createUser(@RequestBody User user) {
		if (userRepository.findByUsername(user.getUsername()).isPresent()) {
			return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
		}
		// TODO : Check hibernate validation library uses
		user.setPassword(passwordEncoder.encode(user.getPassword()));
		User savedUser = userRepository.save(user);
		return ResponseEntity.ok(savedUser);
	}

	// 2. Get All Users
	@GetMapping
	public List<User> getAllUsers() {
		return userRepository.findAll();
	}

	// 3. Get User by ID
	@GetMapping("/{id}")
	public ResponseEntity<?> getUser(@PathVariable Long id) {
		return userRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
	}

	// 4. Update User
	@PutMapping("/{id}")
	public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
		return userRepository.findById(id).map(user -> {
			user.setUsername(userDetails.getUsername());
			if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
				user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
			}
			userRepository.save(user);
			return ResponseEntity.ok(Map.of("message", "User updated successfully"));
		}).orElse(ResponseEntity.notFound().build());
	}

	// 5. Delete User
	@DeleteMapping("/{id}")
	public ResponseEntity<?> deleteUser(@PathVariable Long id) {
		return userRepository.findById(id).map(user -> {
			userRepository.delete(user);
			return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
		}).orElse(ResponseEntity.notFound().build());
	}
}