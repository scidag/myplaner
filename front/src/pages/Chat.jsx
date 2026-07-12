import { useState, useEffect, useRef, useCallback } from 'react';
import SessionList from '../components/SessionList';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import ChatToTaskModal from '../components/ChatToTaskModal';
import { useToast } from '../components/Toast';
import {
  listSessions,
  createSession,
  deleteSession,
  getMessages,
  streamChat,
  messageToTask,
} from '../api/chat';

export default function Chat() {
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [modalMessage, setModalMessage] = useState(null);
  const [converting, setConverting] = useState(false);

  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const streamingIndexRef = useRef(-1);

  // 加载会话列表
  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await listSessions();
      const list = Array.isArray(res) ? res : [];
      setSessions(list);
      return list;
    } catch (err) {
      toast(err.message, 'error');
      return [];
    } finally {
      setLoadingSessions(false);
    }
  }, [toast]);

  // 加载消息
  const fetchMessages = useCallback(async (sessionId) => {
    if (!sessionId) return;
    setLoadingMessages(true);
    try {
      const res = await getMessages(sessionId);
      setMessages(Array.isArray(res) ? res : []);
    } catch (err) {
      toast(err.message, 'error');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [toast]);

  // 进入页面：加载会话，默认选中第一个
  useEffect(() => {
    (async () => {
      const list = await fetchSessions();
      if (list.length > 0) {
        const firstId = list[0].id;
        setActiveSessionId(firstId);
        fetchMessages(firstId);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 组件卸载时中止未完成的 SSE 流，避免对已卸载组件 setState 和网络泄漏
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleSelectSession = (id) => {
    if (id === activeSessionId || streaming) return;
    setActiveSessionId(id);
    fetchMessages(id);
  };

  const handleCreateSession = async () => {
    if (streaming) return;
    try {
      const created = await createSession('新对话');
      const newSession = { ...created, title: created?.title || '新对话' };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setMessages([]);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleDeleteSession = async (id) => {
    if (streaming) return;
    try {
      await deleteSession(id);
      // 先计算 next，再在 updater 之外执行副作用（避免 StrictMode 双发请求）
      let nextActive = activeSessionId;
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (id === activeSessionId) {
        // 重新拉取会话列表以确定下一个选中项
        const list = await fetchSessions();
        if (list.length > 0) {
          nextActive = list[0].id;
          setActiveSessionId(nextActive);
          fetchMessages(nextActive);
        } else {
          setActiveSessionId(null);
          setMessages([]);
        }
      }
      toast('会话已删除', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleSend = async (content) => {
    if (!activeSessionId || streaming) return;

    // 立即追加用户消息 + 占位 AI 消息
    const userMsg = { role: 'user', content };
    const aiPlaceholder = { role: 'assistant', content: '', streaming: true };
    setMessages((prev) => [...prev, userMsg, aiPlaceholder]);
    setStreaming(true);

    const aiIndex = messages.length + 1; // 占位 AI 消息在数组中的索引
    streamingIndexRef.current = aiIndex;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await streamChat(activeSessionId, content, {
        onChunk: (chunk) => {
          setMessages((prev) => {
            const next = [...prev];
            const idx = streamingIndexRef.current;
            if (idx >= 0 && idx < next.length) {
              const cur = next[idx];
              next[idx] = { ...cur, content: (cur.content || '') + chunk, streaming: true };
            }
            return next;
          });
        },
        onDone: () => {
          setMessages((prev) => {
            const next = [...prev];
            const idx = streamingIndexRef.current;
            if (idx >= 0 && idx < next.length) {
              next[idx] = { ...next[idx], streaming: false };
            }
            return next;
          });
        },
        onError: (msg) => {
          toast(msg || 'AI 回复出错', 'error');
        },
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        // 用户主动停止，保留已生成内容
      } else {
        toast(err.message, 'error');
      }
    } finally {
      setStreaming(false);
      streamingIndexRef.current = -1;
      abortControllerRef.current = null;
      // 终止占位 AI 消息的流式状态
      setMessages((prev) => prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)));
      // 刷新会话列表预览
      fetchSessions();
      // 用服务端持久化消息（带 id）替换占位，避免转待办时 modalMessage.id 为 undefined
      if (activeSessionId) fetchMessages(activeSessionId);
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
  };

  const handleAddTask = (message) => {
    if (streaming) return;
    setModalMessage(message);
  };

  const handleConfirmTask = async (data) => {
    if (!modalMessage) return;
    setConverting(true);
    try {
      await messageToTask(modalMessage.id, data);
      toast('已加入待办', 'success');
      setModalMessage(null);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setConverting(false);
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const showEmpty = !loadingSessions && sessions.length === 0;

  return (
    <div className="chat-page">
      <SessionList
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelect={handleSelectSession}
        onCreate={handleCreateSession}
        onDelete={handleDeleteSession}
      />

      <section className="chat-main">
        {showEmpty ? (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">💬</div>
            <h2 className="chat-welcome-title">开始一段新对话</h2>
            <p className="chat-welcome-desc">
              与 AI 实时对话，获取建议后一键加入待办列表
            </p>
            <div className="chat-welcome-suggestions">
              <div className="chat-suggestion">📝 帮我规划本周的学习计划</div>
              <div className="chat-suggestion">🍳 推荐三道简单易做的晚餐</div>
              <div className="chat-suggestion">🏋️ 给我制定一个居家健身方案</div>
            </div>
            <button type="button" className="chat-welcome-btn" onClick={handleCreateSession}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              新建对话
            </button>
          </div>
        ) : (
          <>
            <header className="chat-header">
              <h1 className="chat-header-title">
                {activeSession?.title || 'AI 对话'}
              </h1>
              <span className="chat-header-badge">AI 助手</span>
            </header>

            <div className="chat-messages">
              {loadingMessages ? (
                <div className="chat-loading">消息加载中...</div>
              ) : messages.length === 0 ? (
                <div className="chat-empty-msg">发送一条消息开始对话吧</div>
              ) : (
                messages.map((m, idx) => (
                  <ChatMessage
                    key={idx}
                    message={m}
                    onAddTask={handleAddTask}
                    streaming={!!m.streaming}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <ChatInput onSend={handleSend} onStop={handleStop} streaming={streaming} />
          </>
        )}
      </section>

      {modalMessage && (
        <ChatToTaskModal
          message={modalMessage}
          onClose={() => setModalMessage(null)}
          onConfirm={handleConfirmTask}
          loading={converting}
        />
      )}
    </div>
  );
}
