package com.myplanner.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Configuration
public class ChatClientConfig {

    private static final Logger log = LoggerFactory.getLogger(ChatClientConfig.class);

    /** 系统提示词文件位置（classpath 下的纯文本）。 */
    private static final String SYSTEM_PROMPT_LOCATION = "classpath:prompts/chat-system-prompt.txt";

    /** 兜底提示词：当外部文件读取失败时使用，保证服务能启动。 */
    private static final String FALLBACK_SYSTEM_PROMPT =
            "你是 MyPlanner 的 AI 助手，帮助用户规划和管理任务。回复使用中文，支持 Markdown 格式。";

    private final ResourceLoader resourceLoader;

    public ChatClientConfig(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        String systemPrompt = loadSystemPrompt();
        log.info("[ChatClientConfig] 系统提示词已加载，字符数={}", systemPrompt.length());
        return builder
            .defaultSystem(systemPrompt)
            .build();
    }

    /**
     * 从 classpath:prompts/chat-system-prompt.txt 加载系统提示词。
     * 文件不存在或读取失败时回退到内置简短提示词，保证服务可用。
     */
    private String loadSystemPrompt() {
        try {
            Resource resource = resourceLoader.getResource(SYSTEM_PROMPT_LOCATION);
            if (!resource.exists()) {
                log.warn("[ChatClientConfig] 系统提示词文件不存在: {}，使用兜底提示词", SYSTEM_PROMPT_LOCATION);
                return FALLBACK_SYSTEM_PROMPT;
            }
            String content = StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
            if (content.isBlank()) {
                log.warn("[ChatClientConfig] 系统提示词文件为空: {}，使用兜底提示词", SYSTEM_PROMPT_LOCATION);
                return FALLBACK_SYSTEM_PROMPT;
            }
            return content.trim();
        } catch (IOException e) {
            log.error("[ChatClientConfig] 读取系统提示词文件失败: {}，使用兜底提示词", SYSTEM_PROMPT_LOCATION, e);
            return FALLBACK_SYSTEM_PROMPT;
        }
    }
}
