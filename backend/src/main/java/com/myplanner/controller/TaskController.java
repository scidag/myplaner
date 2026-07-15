package com.myplanner.controller;

import com.myplanner.common.BaseResponse;
import com.myplanner.common.PageResult;
import com.myplanner.entity.SysTask;
import com.myplanner.service.TaskService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
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
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createDateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createDateTo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDateTo,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String sortDir) {
        Long userId = (Long) auth.getPrincipal();
        return BaseResponse.success(taskService.getTasks(userId, page, size, status, keyword, createDate,
                createDateFrom, createDateTo, dueDateFrom, dueDateTo, sort, sortDir));
    }

    @PostMapping
    public BaseResponse<SysTask> createTask(
            Authentication auth,
            @RequestBody Map<String, Object> body) {
        Long userId = (Long) auth.getPrincipal();
        String title = (String) body.get("title");
        String description = (String) body.get("description");
        String priority = (String) body.get("priority");
        LocalDate dueDate = body.get("dueDate") != null
                ? LocalDate.parse((String) body.get("dueDate"))
                : null;
        return BaseResponse.success(taskService.createTask(userId, title, description, priority, dueDate));
    }

    @PutMapping("/{id}")
    public BaseResponse<SysTask> updateTask(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Long userId = (Long) auth.getPrincipal();
        String title = (String) body.get("title");
        String description = (String) body.get("description");
        String priority = (String) body.get("priority");
        LocalDate dueDate = body.get("dueDate") != null
                ? LocalDate.parse((String) body.get("dueDate"))
                : null;
        return BaseResponse.success(taskService.updateTask(userId, id, title, description, priority, dueDate));
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

    @PatchMapping("/batch/status")
    public BaseResponse<Void> batchUpdateStatus(
            Authentication auth,
            @RequestBody Map<String, Object> body) {
        Long userId = (Long) auth.getPrincipal();
        @SuppressWarnings("unchecked")
        List<Long> ids = ((List<Integer>) body.get("ids")).stream().map(Long::valueOf).toList();
        String status = (String) body.get("status");
        taskService.batchUpdateStatus(userId, ids, status);
        return BaseResponse.success();
    }

    @DeleteMapping("/batch")
    public BaseResponse<Void> batchDelete(
            Authentication auth,
            @RequestBody Map<String, Object> body) {
        Long userId = (Long) auth.getPrincipal();
        @SuppressWarnings("unchecked")
        List<Long> ids = ((List<Integer>) body.get("ids")).stream().map(Long::valueOf).toList();
        taskService.batchDelete(userId, ids);
        return BaseResponse.success();
    }

    @DeleteMapping("/{id}")
    public BaseResponse<Void> deleteTask(Authentication auth, @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        taskService.deleteTask(userId, id);
        return BaseResponse.success();
    }
}
