package com.myplanner.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myplanner.service.dto.TaskCandidate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;
import java.util.List;

/**
 * 任务抽取工具类。
 *
 * 采用 Spring AI 结构化输出思路（非 @Tool / Function Calling），
 * 由 ChatServiceImpl 调用 ChatClient 拿到原始文本后，交由本类解析为候选任务列表。
 * 这样可规避 DeepSeek 经百炼调用时 Function Calling 的兼容性问题。
 */
public final class TaskExtractorTool {

    private static final Logger log = LoggerFactory.getLogger(TaskExtractorTool.class);

    public static final String SYSTEM_PROMPT =
            "你是任务抽取助手。分析以下对话，抽取所有明确的、可执行的任务。" +
            "以 JSON 数组格式返回，每个元素含 title(必填,简洁可执行)、description(详细描述)、" +
            "dueDate(YYYY-MM-DD格式,无明确日期则为null)。" +
            "仅抽取可执行任务，忽略寒暄提问。" +
            "返回纯 JSON 数组，不要 markdown 代码块。";

    private TaskExtractorTool() {
    }

    /**
     * 将 AI 返回的原始文本解析为候选任务列表。
     * 自动剥离 markdown 代码块包裹。
     *
     * @throws RuntimeException 解析失败时抛出，调用方应据此决定是否标记 extracted。
     */
    public static List<TaskCandidate> parseCandidates(String raw, ObjectMapper objectMapper) {
        if (raw == null || raw.isBlank()) {
            return Collections.emptyList();
        }
        String json = stripCodeFence(raw);
        try {
            return objectMapper.readValue(json, new TypeReference<List<TaskCandidate>>() {});
        } catch (Exception e) {
            log.warn("Failed to parse task candidates from AI response: {}", e.getMessage());
            throw new RuntimeException("AI 返回内容无法解析为任务列表", e);
        }
    }

    /**
     * 剥离可能的 ```json ... ``` 或 ``` ... ``` 代码块包裹。
     */
    private static String stripCodeFence(String raw) {
        String text = raw.trim();
        if (text.startsWith("```")) {
            int firstNewline = text.indexOf('\n');
            if (firstNewline > 0) {
                text = text.substring(firstNewline + 1);
            }
            int lastFence = text.lastIndexOf("```");
            if (lastFence >= 0) {
                text = text.substring(0, lastFence);
            }
            text = text.trim();
        }
        return text;
    }
}
