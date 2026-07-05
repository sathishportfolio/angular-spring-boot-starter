package com.example.angularspring.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @CrossOrigin(origins = "http://localhost:4200")
    @GetMapping("/")
    public String home() {
        return "Spring Boot is running!";
    }
}
