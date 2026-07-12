package com.myplanner.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ChatClientConfig {
    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder
            .defaultSystem("你是 MyPlanner 的 AI 助手，帮助用户规划和管理任务。回复使用中文，支持 Markdown 格式。")
            .build();
    }
}
