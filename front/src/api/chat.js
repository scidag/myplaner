import request from '../utils/request';

// ===== 会话管理 =====
export function createSession(title) {
  return request.post('/chat/sessions', { title });
}

export function listSessions() {
  return request.get('/chat/sessions');
}

export function renameSession(id, title) {
  return request.patch(`/chat/sessions/${id}`, { title });
}

export function deleteSession(id) {
  return request.delete(`/chat/sessions/${id}`);
}

export function getMessages(sessionId) {
  return request.get(`/chat/sessions/${sessionId}/messages`);
}

// ===== 单条转待办 =====
export function messageToTask(messageId, data) {
  return request.post(`/chat/messages/${messageId}/to-task`, data);
}

// ===== SSE 流式对话 =====
// 由于需要 POST + Authorization Header，无法使用 EventSource，改用 fetch + ReadableStream
export async function streamChat(sessionId, content, { onChunk, onDone, onError, signal } = {}) {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ content }),
    signal,
  });

  if (!response.ok) {
    let msg = `HTTP ${response.status}`;
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error(msg);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // 保留最后一条不完整的行
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload) continue;
        try {
          const json = JSON.parse(payload);
          if (json.type === 'chunk') onChunk?.(json.content);
          else if (json.type === 'done') onDone?.(json);
          else if (json.type === 'error') onError?.(json.message);
        } catch (err) {
          // 忽略无法解析的行
        }
      }
    }
  } finally {
    // 释放 reader 锁，避免异常路径下残留
    reader.cancel().catch(() => {});
  }
}
