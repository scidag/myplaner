package com.myplanner.service;

import com.myplanner.common.PageResult;
import com.myplanner.entity.SysTask;
import java.time.LocalDate;
import java.util.List;

public interface TaskService {
    PageResult<SysTask> getTasks(Long userId, int page, int size, String status, String keyword, LocalDate createDate,
                                 LocalDate createDateFrom, LocalDate createDateTo, LocalDate dueDateFrom, LocalDate dueDateTo,
                                 String sort, String sortDir);
    SysTask createTask(Long userId, String title, String description, String priority, LocalDate dueDate);
    SysTask updateTask(Long userId, Long taskId, String title, String description, String priority, LocalDate dueDate);
    void updateStatus(Long userId, Long taskId, String status);
    void deleteTask(Long userId, Long taskId);
    void batchUpdateStatus(Long userId, List<Long> ids, String status);
    void batchDelete(Long userId, List<Long> ids);
}
