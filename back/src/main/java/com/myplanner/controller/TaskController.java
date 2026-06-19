package com.myplanner.controller;

import com.myplanner.common.BaseResponse;
import com.myplanner.common.PageResult;
import com.myplanner.entity.SysTask;
import com.myplanner.service.TaskService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public BaseResponse<PageResult<SysTask>> getTasks(
            Authentication auth,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        Long userId = (Long) auth.getPrincipal();
        return BaseResponse.success(taskService.getTasks(userId, page, size, status, keyword));
    }

    @PostMapping
    public BaseResponse<SysTask> createTask(
            Authentication auth,
            @RequestBody Map<String, Object> body) {
        Long userId = (Long) auth.getPrincipal();
        String title = (String) body.get("title");
        String description = (String) body.get("description");
        LocalDate dueDate = body.get("dueDate") != null
                ? LocalDate.parse((String) body.get("dueDate"))
                : null;
        return BaseResponse.success(taskService.createTask(userId, title, description, dueDate));
    }

    @PutMapping("/{id}")
    public BaseResponse<SysTask> updateTask(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Long userId = (Long) auth.getPrincipal();
        String title = (String) body.get("title");
        String description = (String) body.get("description");
        LocalDate dueDate = body.get("dueDate") != null
                ? LocalDate.parse((String) body.get("dueDate"))
                : null;
        return BaseResponse.success(taskService.updateTask(userId, id, title, description, dueDate));
    }

    @PatchMapping("/{id}/status")
    public BaseResponse<Void> updateStatus(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Long userId = (Long) auth.getPrincipal();
        taskService.updateStatus(userId, id, body.get("status"));
        return BaseResponse.success();
    }

    @DeleteMapping("/{id}")
    public BaseResponse<Void> deleteTask(Authentication auth, @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        taskService.deleteTask(userId, id);
        return BaseResponse.success();
    }
}
