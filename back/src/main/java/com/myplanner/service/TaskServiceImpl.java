package com.myplanner.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.myplanner.common.BusinessException;
import com.myplanner.common.PageResult;
import com.myplanner.common.ResultCode;
import com.myplanner.entity.SysTask;
import com.myplanner.mapper.SysTaskMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TaskServiceImpl implements TaskService {

    private static final Logger log = LoggerFactory.getLogger(TaskServiceImpl.class);
    private final SysTaskMapper taskMapper;

    public TaskServiceImpl(SysTaskMapper taskMapper) {
        this.taskMapper = taskMapper;
    }

    @Override
    public PageResult<SysTask> getTasks(Long userId, int page, int size, String status, String keyword, LocalDate createDate,
                                        LocalDate createDateFrom, LocalDate createDateTo, LocalDate dueDateFrom, LocalDate dueDateTo,
                                        String sort, String sortDir) {
        if (size > 100) size = 100;
        if (page < 1) page = 1;
        if (size < 1) size = 20;

        LambdaQueryWrapper<SysTask> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysTask::getUserId, userId);

        if (StringUtils.hasText(status) && !"ALL".equalsIgnoreCase(status)) {
            wrapper.eq(SysTask::getStatus, status.toUpperCase());
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.like(SysTask::getTitle, keyword.trim());
        }
        if (createDate != null) {
            wrapper.apply("DATE(create_time) = {0}", createDate);
        }
        if (createDateFrom != null) {
            wrapper.ge(SysTask::getCreateTime, createDateFrom.atStartOfDay());
        }
        if (createDateTo != null) {
            wrapper.le(SysTask::getCreateTime, createDateTo.atTime(23, 59, 59));
        }
        if (dueDateFrom != null) {
            wrapper.ge(SysTask::getDueDate, dueDateFrom);
        }
        if (dueDateTo != null) {
            wrapper.le(SysTask::getDueDate, dueDateTo);
        }

        if (StringUtils.hasText(sort)) {
            boolean asc = "asc".equalsIgnoreCase(sortDir);
            String field = sort;
            if ("createTime".equals(field)) {
                if (asc) wrapper.orderByAsc(SysTask::getCreateTime);
                else wrapper.orderByDesc(SysTask::getCreateTime);
            } else if ("dueDate".equals(field)) {
                wrapper.last("ORDER BY " + (asc ? "due_date IS NULL ASC, due_date ASC" : "due_date IS NULL DESC, due_date DESC"));
            } else if ("status".equals(field)) {
                wrapper.last("ORDER BY FIELD(status,'IN_PROGRESS','TODO','DONE') " + (asc ? "ASC" : "DESC"));
            } else if ("title".equals(field)) {
                if (asc) wrapper.orderByAsc(SysTask::getTitle);
                else wrapper.orderByDesc(SysTask::getTitle);
            }
        } else if ("TODO".equalsIgnoreCase(status)) {
            wrapper.orderByDesc(SysTask::getCreateTime);
        } else if (createDate != null) {
            wrapper.last("ORDER BY FIELD(status,'IN_PROGRESS','TODO','DONE') ASC");
        } else {
            wrapper.last("ORDER BY FIELD(status,'IN_PROGRESS','TODO','DONE') ASC, " +
                    "CASE WHEN status <> 'DONE' THEN due_date END ASC, " +
                    "CASE WHEN status = 'DONE' THEN completed_time END DESC");
        }

        IPage<SysTask> pg = taskMapper.selectPage(new Page<>(page, size), wrapper);

        return new PageResult<>(pg.getTotal(), pg.getCurrent(), pg.getSize(), pg.getRecords());
    }

    @Override
    public SysTask createTask(Long userId, String title, String description, LocalDate dueDate) {
        if (!StringUtils.hasText(title) || title.length() > 100) {
            throw new BusinessException(400, "标题必填且不超过100字符");
        }
        if (StringUtils.hasText(description) && description.length() > 500) {
            throw new BusinessException(400, "描述不超过500字符");
        }
        if (dueDate != null && dueDate.isBefore(LocalDate.now())) {
            throw new BusinessException(400, "截止日期不能早于今天");
        }

        SysTask task = new SysTask();
        task.setUserId(userId);
        task.setTitle(title.trim());
        task.setDescription(StringUtils.hasText(description) ? description.trim() : null);
        task.setStatus("TODO");
        task.setDueDate(dueDate);
        taskMapper.insert(task);
        return task;
    }

    @Override
    public SysTask updateTask(Long userId, Long taskId, String title, String description, LocalDate dueDate) {
        SysTask task = taskMapper.selectById(taskId);
        if (task == null || !task.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.NOT_FOUND);
        }

        if (title != null) {
            if (title.isBlank() || title.length() > 100) {
                throw new BusinessException(400, "标题必填且不超过100字符");
            }
            task.setTitle(title.trim());
        }
        if (description != null) {
            if (description.length() > 500) {
                throw new BusinessException(400, "描述不超过500字符");
            }
            task.setDescription(description.trim());
        }
        if (dueDate != null) {
            if (dueDate.isBefore(LocalDate.now())) {
                throw new BusinessException(400, "截止日期不能早于今天");
            }
            task.setDueDate(dueDate);
        }

        int updated = taskMapper.updateById(task);
        if (updated == 0) {
            throw new BusinessException(409, "数据已被修改，请刷新后重试");
        }
        return taskMapper.selectById(taskId);
    }

    @Override
    public void updateStatus(Long userId, Long taskId, String status) {
        if (!List.of("TODO", "IN_PROGRESS", "DONE").contains(status)) {
            throw new BusinessException(400, "无效的状态值");
        }

        SysTask task = taskMapper.selectById(taskId);
        if (task == null || !task.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.NOT_FOUND);
        }

        task.setStatus(status);
        if ("DONE".equals(status)) {
            task.setCompletedTime(LocalDateTime.now());
        } else {
            task.setCompletedTime(null);
        }

        int updated = taskMapper.updateById(task);
        if (updated == 0) {
            throw new BusinessException(409, "数据已被修改，请刷新后重试");
        }
    }

    @Override
    public void deleteTask(Long userId, Long taskId) {
        SysTask task = taskMapper.selectById(taskId);
        if (task == null || !task.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.NOT_FOUND);
        }
        taskMapper.deleteById(taskId);
    }

    @Override
    public void batchUpdateStatus(Long userId, List<Long> ids, String status) {
        if (!List.of("TODO", "IN_PROGRESS", "DONE").contains(status)) {
            throw new BusinessException(400, "无效的状态值");
        }
        if (ids == null || ids.isEmpty()) {
            throw new BusinessException(400, "请选择要操作的任务");
        }
        List<SysTask> tasks = taskMapper.selectBatchIds(ids);
        for (SysTask task : tasks) {
            if (!task.getUserId().equals(userId)) {
                throw new BusinessException(ResultCode.FORBIDDEN);
            }
            task.setStatus(status);
            if ("DONE".equals(status)) {
                task.setCompletedTime(LocalDateTime.now());
            } else {
                task.setCompletedTime(null);
            }
            taskMapper.updateById(task);
        }
    }

    @Override
    public void batchDelete(Long userId, List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new BusinessException(400, "请选择要删除的任务");
        }
        List<SysTask> tasks = taskMapper.selectBatchIds(ids);
        for (SysTask task : tasks) {
            if (!task.getUserId().equals(userId)) {
                throw new BusinessException(ResultCode.FORBIDDEN);
            }
        }
        taskMapper.deleteBatchIds(ids);
    }
}
