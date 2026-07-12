package com.myplanner.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myplanner.common.BaseResponse;
import com.myplanner.common.BusinessException;
import com.myplanner.entity.SysChatMessage;
import com.myplanner.entity.SysChatSession;
import com.myplanner.entity.SysTask;
import com.myplanner.service.ChatService;
import com.myplanner.service.dto.SessionVO;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final ObjectMapper objectMapper;

    public ChatController(ChatService chatService, ObjectMapper objectMapper) {
        this.chatService = chatService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/sessions")
    public BaseResponse<SysChatSession> createSession(
            Authentication auth,
            @RequestBody(required = false) Map<String, String> body) {
        Long userId = (Long) auth.getPrincipal();
        String title = body != null ? body.get("title") : null;
        return BaseResponse.success(chatService.createSession(userId, title));
    }

    @GetMapping("/sessions")
    public BaseResponse<List<SessionVO>> listSessions(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return BaseResponse.success(chatService.listSessions(userId));
    }

    @PatchMapping("/sessions/{id}")
    public BaseResponse<SysChatSession> renameSession(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Long userId = (Long) auth.getPrincipal();
        return BaseResponse.success(chatService.renameSession(userId, id, body.get("title")));
    }

    @DeleteMapping("/sessions/{id}")
    public BaseResponse<Void> deleteSession(
            Authentication auth,
            @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        chatService.deleteSession(userId, id);
        return BaseResponse.success();
    }

    @GetMapping("/sessions/{id}/messages")
    public BaseResponse<List<SysChatMessage>> getMessages(
            Authentication auth,
            @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        return BaseResponse.success(chatService.getMessages(userId, id));
    }

    @PostMapping(value = "/sessions/{id}/messages", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> sendMessage(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Long userId = (Long) auth.getPrincipal();
        String content = body.get("content");
        // 参数校验在 defer 之外同步执行，失败抛 BusinessException 走 GlobalExceptionHandler 返回正确 HTTP 状态码
        if (!StringUtils.hasText(content)) {
            throw new BusinessException(400, "消息内容不能为空");
        }
        return chatService.streamChat(userId, id, content)
                .map(chunk -> sse(toMap("type", "chunk", "content", chunk)))
                .concatWith(Flux.just(sse(toMap("type", "done"))))
                .onErrorResume(e -> {
                    // 仅对 BusinessException 透传 message，避免泄露内部错误细节
                    String msg = (e instanceof BusinessException)
                            ? e.getMessage()
                            : "AI 服务暂时不可用，请稍后重试";
                    return Flux.just(sse(toMap("type", "error", "message", msg)));
                });
    }

    @PostMapping("/messages/{id}/to-task")
    public BaseResponse<SysTask> toTask(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Long userId = (Long) auth.getPrincipal();
        String title = (String) body.get("title");
        String description = (String) body.get("description");
        LocalDate dueDate = body.get("dueDate") != null
                ? LocalDate.parse((String) body.get("dueDate"))
                : null;
        return BaseResponse.success(chatService.toTask(userId, id, title, description, dueDate));
    }

    private ServerSentEvent<String> sse(Map<String, Object> payload) {
        return ServerSentEvent.<String>builder().data(toJson(payload)).build();
    }

    private Map<String, Object> toMap(Object... kv) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            map.put((String) kv[i], kv[i + 1]);
        }
        return map;
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "{\"type\":\"error\",\"message\":\"序列化失败\"}";
        }
    }
}
