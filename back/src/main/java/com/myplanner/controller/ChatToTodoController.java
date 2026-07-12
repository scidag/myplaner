package com.myplanner.controller;

import com.myplanner.common.BaseResponse;
import com.myplanner.service.ChatService;
import com.myplanner.service.dto.BatchCreateResult;
import com.myplanner.service.dto.TaskCandidate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatToTodoController {

    private final ChatService chatService;

    public ChatToTodoController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/sessions/{id}/extract-tasks")
    public BaseResponse<List<TaskCandidate>> extractTasks(
            Authentication auth,
            @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        return BaseResponse.success(chatService.extractTasks(userId, id));
    }

    @PostMapping("/tasks/batch")
    public BaseResponse<BatchCreateResult> batchCreate(
            Authentication auth,
            @RequestBody Map<String, Object> body) {
        Long userId = (Long) auth.getPrincipal();
        Object tasksObj = body.get("tasks");
        if (!(tasksObj instanceof List)) {
            return BaseResponse.success(new BatchCreateResult(0, 0));
        }
        List<TaskCandidate> candidates = new ArrayList<>();
        for (Object item : (List<?>) tasksObj) {
            if (item instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> map = (Map<String, Object>) item;
                TaskCandidate c = new TaskCandidate();
                c.setTitle((String) map.get("title"));
                c.setDescription((String) map.get("description"));
                Object dueDate = map.get("dueDate");
                c.setDueDate(dueDate != null ? dueDate.toString() : null);
                Object sourceMessageId = map.get("sourceMessageId");
                if (sourceMessageId instanceof Number) {
                    c.setSourceMessageId(((Number) sourceMessageId).longValue());
                }
                c.setSourceSnippet((String) map.get("sourceSnippet"));
                candidates.add(c);
            }
        }
        return BaseResponse.success(chatService.batchCreateTasks(userId, candidates));
    }
}
