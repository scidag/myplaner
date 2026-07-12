package com.myplanner.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myplanner.common.BusinessException;
import com.myplanner.common.ResultCode;
import com.myplanner.entity.SysChatMessage;
import com.myplanner.entity.SysChatSession;
import com.myplanner.entity.SysTask;
import com.myplanner.mapper.SysChatMessageMapper;
import com.myplanner.mapper.SysChatSessionMapper;
import com.myplanner.service.dto.BatchCreateResult;
import com.myplanner.service.dto.SessionVO;
import com.myplanner.service.dto.TaskCandidate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class ChatServiceImpl implements ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatServiceImpl.class);
    private static final int CONTEXT_WINDOW = 20;
    private static final String ROLE_USER = "user";
    private static final String ROLE_ASSISTANT = "assistant";

    private final SysChatSessionMapper sessionMapper;
    private final SysChatMessageMapper messageMapper;
    private final ChatClient chatClient;
    private final TaskService taskService;
    private final ObjectMapper objectMapper;

    public ChatServiceImpl(SysChatSessionMapper sessionMapper,
                           SysChatMessageMapper messageMapper,
                           ChatClient chatClient,
                           TaskService taskService,
                           ObjectMapper objectMapper) {
        this.sessionMapper = sessionMapper;
        this.messageMapper = messageMapper;
        this.chatClient = chatClient;
        this.taskService = taskService;
        this.objectMapper = objectMapper;
    }

    @Override
    public SysChatSession createSession(Long userId, String title) {
        SysChatSession session = new SysChatSession();
        session.setUserId(userId);
        session.setTitle(StringUtils.hasText(title) ? title.trim() : "新对话");
        sessionMapper.insert(session);
        return session;
    }

    @Override
    public List<SessionVO> listSessions(Long userId) {
        List<SysChatSession> sessions = sessionMapper.selectList(
                new LambdaQueryWrapper<SysChatSession>()
                        .eq(SysChatSession::getUserId, userId)
                        .orderByDesc(SysChatSession::getUpdateTime));
        List<SessionVO> result = new ArrayList<>();
        for (SysChatSession s : sessions) {
            SessionVO vo = new SessionVO();
            vo.setSession(s);
            SysChatMessage last = messageMapper.selectOne(
                    new LambdaQueryWrapper<SysChatMessage>()
                            .eq(SysChatMessage::getSessionId, s.getId())
                            .orderByDesc(SysChatMessage::getCreateTime)
                            .orderByDesc(SysChatMessage::getId)
                            .last("LIMIT 1"));
            if (last != null && last.getContent() != null) {
                String c = last.getContent();
                vo.setLastMessage(c.length() > 50 ? c.substring(0, 50) : c);
            }
            result.add(vo);
        }
        return result;
    }

    @Override
    public SysChatSession renameSession(Long userId, Long sessionId, String title) {
        SysChatSession session = sessionMapper.selectById(sessionId);
        if (session == null || !session.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.NOT_FOUND);
        }
        if (!StringUtils.hasText(title) || title.length() > 100) {
            throw new BusinessException(400, "标题必填且不超过100字符");
        }
        session.setTitle(title.trim());
        sessionMapper.updateById(session);
        return sessionMapper.selectById(sessionId);
    }

    @Override
    public void deleteSession(Long userId, Long sessionId) {
        SysChatSession session = sessionMapper.selectById(sessionId);
        if (session == null || !session.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.NOT_FOUND);
        }
        messageMapper.delete(new LambdaQueryWrapper<SysChatMessage>()
                .eq(SysChatMessage::getSessionId, sessionId));
        sessionMapper.deleteById(sessionId);
    }

    @Override
    public List<SysChatMessage> getMessages(Long userId, Long sessionId) {
        SysChatSession session = sessionMapper.selectById(sessionId);
        if (session == null || !session.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.NOT_FOUND);
        }
        return messageMapper.selectList(
                new LambdaQueryWrapper<SysChatMessage>()
                        .eq(SysChatMessage::getSessionId, sessionId)
                        .orderByAsc(SysChatMessage::getCreateTime)
                        .orderByAsc(SysChatMessage::getId));
    }

    @Override
    public Flux<String> streamChat(Long userId, Long sessionId, String content) {
        return Flux.defer(() -> {
            if (!StringUtils.hasText(content)) {
                return Flux.error(new BusinessException(400, "消息内容不能为空"));
            }
            SysChatSession session = sessionMapper.selectById(sessionId);
            if (session == null || !session.getUserId().equals(userId)) {
                return Flux.error(new BusinessException(ResultCode.NOT_FOUND));
            }

            SysChatMessage userMsg = new SysChatMessage();
            userMsg.setSessionId(sessionId);
            userMsg.setRole(ROLE_USER);
            userMsg.setContent(content);
            userMsg.setExtracted(0);
            messageMapper.insert(userMsg);

            // 同秒消息顺序不确定，加 id 作为次级排序保证上下文顺序稳定
            List<SysChatMessage> recent = messageMapper.selectList(
                    new LambdaQueryWrapper<SysChatMessage>()
                            .eq(SysChatMessage::getSessionId, sessionId)
                            .orderByDesc(SysChatMessage::getCreateTime)
                            .orderByDesc(SysChatMessage::getId)
                            .last("LIMIT " + CONTEXT_WINDOW));
            Collections.reverse(recent);

            List<Message> messages = new ArrayList<>();
            for (SysChatMessage m : recent) {
                if (ROLE_USER.equals(m.getRole())) {
                    messages.add(new UserMessage(m.getContent()));
                } else {
                    messages.add(new AssistantMessage(m.getContent()));
                }
            }

            StringBuilder fullResponse = new StringBuilder();
            return chatClient.prompt()
                    .messages(messages)
                    .stream()
                    .content()
                    .doOnNext(fullResponse::append)
                    .doFinally(signal -> {
                        String reply = fullResponse.toString();
                        if (reply.isEmpty()) {
                            return;
                        }
                        Schedulers.boundedElastic().schedule(() -> {
                            try {
                                SysChatMessage aiMsg = new SysChatMessage();
                                aiMsg.setSessionId(sessionId);
                                aiMsg.setRole(ROLE_ASSISTANT);
                                aiMsg.setContent(reply);
                                aiMsg.setExtracted(0);
                                messageMapper.insert(aiMsg);
                                // 仅更新 update_time，避免覆盖用户在此期间可能重命名的 title
                                sessionMapper.update(null, new LambdaUpdateWrapper<SysChatSession>()
                                        .eq(SysChatSession::getId, sessionId)
                                        .set(SysChatSession::getUpdateTime, LocalDateTime.now()));
                            } catch (Exception e) {
                                log.error("Failed to persist AI message for session {}", sessionId, e);
                            }
                        });
                    });
        });
    }

    @Override
    public SysTask toTask(Long userId, Long messageId, String title, String description, LocalDate dueDate) {
        SysChatMessage message = messageMapper.selectById(messageId);
        if (message == null) {
            throw new BusinessException(ResultCode.NOT_FOUND);
        }
        SysChatSession session = sessionMapper.selectById(message.getSessionId());
        if (session == null || !session.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.NOT_FOUND);
        }
        return taskService.createTask(userId, title, description, null, dueDate);
    }

    @Override
    public List<TaskCandidate> extractTasks(Long userId, Long sessionId) {
        SysChatSession session = sessionMapper.selectById(sessionId);
        if (session == null || !session.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.NOT_FOUND);
        }

        // 先查询未抽取的消息（用于构建对话和后续回溯）
        List<SysChatMessage> toExtract = messageMapper.selectList(
                new LambdaQueryWrapper<SysChatMessage>()
                        .eq(SysChatMessage::getSessionId, sessionId)
                        .eq(SysChatMessage::getExtracted, 0)
                        .orderByAsc(SysChatMessage::getCreateTime)
                        .orderByAsc(SysChatMessage::getId)
                        .last("LIMIT 100"));

        if (toExtract.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> ids = toExtract.stream().map(SysChatMessage::getId).toList();

        // 并发抢占：原子标记为已抽取，WHERE extracted=0 保证并发请求不会重复处理
        int affected = messageMapper.update(null, new LambdaUpdateWrapper<SysChatMessage>()
                .in(SysChatMessage::getId, ids)
                .eq(SysChatMessage::getExtracted, 0)
                .set(SysChatMessage::getExtracted, 1));
        if (affected == 0) {
            // 另一个并发请求已经抢占了这些消息
            return Collections.emptyList();
        }

        StringBuilder conversation = new StringBuilder();
        for (SysChatMessage m : toExtract) {
            String role = ROLE_USER.equals(m.getRole()) ? "用户" : "助手";
            conversation.append(role).append(": ").append(m.getContent()).append("\n");
        }

        String rawResponse = chatClient.prompt()
                .system(TaskExtractorTool.SYSTEM_PROMPT)
                .user(conversation.toString())
                .call()
                .content();

        // 解析失败时回滚 extracted 标记，允许用户重试
        List<TaskCandidate> candidates;
        try {
            candidates = TaskExtractorTool.parseCandidates(rawResponse, objectMapper);
        } catch (RuntimeException e) {
            messageMapper.update(null, new LambdaUpdateWrapper<SysChatMessage>()
                    .in(SysChatMessage::getId, ids)
                    .set(SysChatMessage::getExtracted, 0));
            log.warn("AI 响应解析失败，已回滚 extracted 标记: {}", e.getMessage());
            throw new BusinessException(500, "AI 响应解析失败，请稍后重试");
        }

        for (TaskCandidate c : candidates) {
            SysChatMessage source = findSourceMessage(c, toExtract);
            if (source != null) {
                c.setSourceMessageId(source.getId());
                String content = source.getContent();
                c.setSourceSnippet(content != null && content.length() > 100
                        ? content.substring(0, 100) : content);
            }
        }

        return candidates;
    }

    @Override
    public BatchCreateResult batchCreateTasks(Long userId, List<TaskCandidate> candidates) {
        int created = 0;
        int failed = 0;
        for (TaskCandidate c : candidates) {
            try {
                LocalDate dueDate = (c.getDueDate() != null && !c.getDueDate().isBlank())
                        ? LocalDate.parse(c.getDueDate()) : null;
                taskService.createTask(userId, c.getTitle(), c.getDescription(), null, dueDate);
                created++;
            } catch (Exception e) {
                log.warn("Failed to create task from candidate '{}': {}", c.getTitle(), e.getMessage());
                failed++;
            }
        }
        return new BatchCreateResult(created, failed);
    }

    private SysChatMessage findSourceMessage(TaskCandidate candidate, List<SysChatMessage> messages) {
        String title = candidate.getTitle();
        if (title != null && !title.isBlank()) {
            for (SysChatMessage m : messages) {
                if (ROLE_USER.equals(m.getRole()) && m.getContent() != null
                        && m.getContent().contains(title)) {
                    return m;
                }
            }
        }
        // 找不到精确匹配时，回退到最后一条 USER 消息；若无 USER 消息返回 null（不追溯 ASSISTANT）
        for (int i = messages.size() - 1; i >= 0; i--) {
            if (ROLE_USER.equals(messages.get(i).getRole())) {
                return messages.get(i);
            }
        }
        return null;
    }
}
