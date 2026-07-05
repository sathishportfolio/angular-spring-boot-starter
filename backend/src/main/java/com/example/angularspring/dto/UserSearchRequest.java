package com.example.angularspring.dto;

public record UserSearchRequest(String search, Boolean isMobileUser, String sortBy, String sortDir, int limit,
		int offset) {
}
