package com.myplanner.service;

import com.myplanner.common.PageResult;
import com.myplanner.entity.SysTask;
import java.time.LocalDate;

public interface TaskService {
    PageResult<SysTask> getTasks(Long userId, int page, int size, String status, String keyword);
    SysTask createTask(Long userId, String title, String description, LocalDate dueDate);
    SysTask updateTask(Long userId, Long taskId, String title, String description, LocalDate dueDate);
    void updateStatus(Long userId, Long taskId, String status);
    void deleteTask(Long userId, Long taskId);
}
