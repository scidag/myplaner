package com.myplanner.controller;

import com.myplanner.common.BaseResponse;
import com.myplanner.service.AuthService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public BaseResponse<Void> register(@RequestBody Map<String, String> body) {
        authService.register(body.get("username"), body.get("password"));
        return BaseResponse.success();
    }

    @PostMapping("/login")
    public BaseResponse<Map<String, String>> login(@RequestBody Map<String, String> body) {
        String token = authService.login(body.get("username"), body.get("password"));
        return BaseResponse.success(Map.of("token", token));
    }
}
