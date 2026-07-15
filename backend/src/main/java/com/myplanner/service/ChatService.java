package com.myplanner.service;

import com.myplanner.entity.SysChatMessage;
import com.myplanner.entity.SysChatSession;
import com.myplanner.entity.SysTask;
import com.myplanner.service.dto.BatchCreateResult;
import com.myplanner.service.dto.SessionVO;
import com.myplanner.service.dto.TaskCandidate;
import reactor.core.publisher.Flux;

import java.time.LocalDate;
import java.util.List;

public interface ChatService {
    SysChatSession createSession(Long userId, String title);
    List<SessionVO> listSessions(Long userId);
    SysChatSession renameSession(Long userId, Long sessionId, String title);
    void deleteSession(Long userId, Long sessionId);
    List<SysChatMessage> getMessages(Long userId, Long sessionId);
    Flux<String> streamChat(Long userId, Long sessionId, String content);
    SysTask toTask(Long userId, Long messageId, String title, String description, LocalDate dueDate);

    List<TaskCandidate> extractTasks(Long userId, Long sessionId);
    BatchCreateResult batchCreateTasks(Long userId, List<TaskCandidate> candidates);
}
