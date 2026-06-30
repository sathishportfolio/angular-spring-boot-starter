package com.example.angularspring.dto;

import lombok.Getter;

@Getter
public class AuthRequest {
	private String username;
	private String email;
	private String mobile;
	private String password;
}
