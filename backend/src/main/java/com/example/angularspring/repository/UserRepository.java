package com.example.angularspring.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.example.angularspring.model.User;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findFirstByUsernameOrEmailOrMobile(String username, String email, String mobile);

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    List<User> findAllByOrderByUsernameDesc();
}
