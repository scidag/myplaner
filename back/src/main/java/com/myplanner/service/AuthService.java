package com.myplanner.service;

public interface AuthService {
    void register(String username, String password);
    String login(String username, String password);
}
