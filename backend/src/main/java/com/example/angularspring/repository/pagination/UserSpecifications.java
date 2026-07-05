package com.example.angularspring.repository.pagination;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import com.example.angularspring.dto.UserSearchRequest;
import com.example.angularspring.model.User;

import jakarta.persistence.criteria.Predicate;

public class UserSpecifications {

	public static Specification<User> createSpecification(UserSearchRequest request) {
		return (root, query, cb) -> {
			List<Predicate> predicates = new ArrayList<>();

			// Global search across email, username, and mobile
			if (request.search() != null && !request.search().isBlank()) {
				String searchPattern = "%" + request.search().toLowerCase() + "%";
				Predicate emailMatch = cb.like(cb.lower(root.get("email")), searchPattern);
				Predicate usernameMatch = cb.like(cb.lower(root.get("username")), searchPattern);
				Predicate mobileMatch = cb.like(cb.lower(root.get("mobile")), searchPattern);

				predicates.add(cb.or(emailMatch, usernameMatch, mobileMatch));
			}

			// Filter by isMobileUser flag
//			if (request.isMobileUser() != null) {
//				predicates.add(cb.equal(root.get("isMobileUser"), request.isMobileUser()));
//			}

			return cb.and(predicates.toArray(new Predicate[0]));
		};
	}
}
