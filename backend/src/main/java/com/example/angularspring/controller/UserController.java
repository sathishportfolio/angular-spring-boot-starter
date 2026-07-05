package com.example.angularspring.controller;

import java.util.Map;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.angularspring.dto.UserSearchRequest;
import com.example.angularspring.model.User;
import com.example.angularspring.repository.UserRepository;
import com.example.angularspring.repository.pagination.OffsetBasedPageRequest;
import com.example.angularspring.repository.pagination.UserSpecifications;

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
		Optional<User> isAlreadyUser = userRepository.findFirstByUsernameOrEmailOrMobile(user.getUsername(), user.getEmail(), user.getMobile());
		if (isAlreadyUser.isPresent()) {
			return ResponseEntity.badRequest().body(Map.of("error", "Duplicate record already exists with username,email or mobile"));
		}
		// TODO : Check hibernate validation library uses
		if (user.getPassword() == null || user.getPassword().isBlank()) {
			user.setPassword("123456");
		}
		user.setPassword(passwordEncoder.encode(user.getPassword()));
		User savedUser = userRepository.save(user);
		return ResponseEntity.ok(savedUser);
	}

	// 2. Get All Users
	@GetMapping
	public ResponseEntity<Map<String, Object>> getUsers(@RequestParam(name = "search", required = false) String search,
			@RequestParam(name = "isMobileUser", required = false) Boolean isMobileUser,
			@RequestParam(name = "sortBy", defaultValue = "email") String sortBy,
			@RequestParam(name = "sortDir", defaultValue = "asc") String sortDir,
			@RequestParam(name = "limit", defaultValue = "10") int limit,
			@RequestParam(name = "offset", defaultValue = "0") int offset) {

		UserSearchRequest request = new UserSearchRequest(search, isMobileUser, sortBy, sortDir, limit, offset);

		Sort sort = request.sortDir().equalsIgnoreCase("desc") ? Sort.by(request.sortBy()).descending()
				: Sort.by(request.sortBy()).ascending();

		OffsetBasedPageRequest pageable = new OffsetBasedPageRequest(request.offset(), request.limit(), sort);

		Page<User> userPage = userRepository.findAll(UserSpecifications.createSpecification(request), pageable);

		// Map the fields dynamically using Map.of
		Map<String, Object> response = Map.of("total", userPage.getTotalElements(), "data", userPage.getContent());

		return ResponseEntity.ok(response);
	}

	// 3. Get User by ID
	@GetMapping("/{id}")
	public ResponseEntity<?> getUser(@PathVariable Long id) {
		return userRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
	}

	// 4. Update User
	@PutMapping("/{id}")
	public ResponseEntity<?> updateUser(@PathVariable("id") Long id, @RequestBody User userDetails) {
		return userRepository.findById(id).map(user -> {
			user.setUsername(userDetails.getUsername());
			user.setEmail(userDetails.getEmail());
			user.setMobile(userDetails.getMobile());
			if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
				user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
			}
			userRepository.save(user);
			return ResponseEntity.ok(Map.of("message", "User updated successfully"));
		}).orElse(ResponseEntity.notFound().build());
	}

	// 5. Delete User
	@DeleteMapping("/{id}")
	public ResponseEntity<?> deleteUser(@PathVariable("id") Long id) {
		return userRepository.findById(id).map(user -> {
			userRepository.delete(user);
			return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
		}).orElse(ResponseEntity.notFound().build());
	}
}
