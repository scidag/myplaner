import { useState, useRef, useEffect } from 'react';

export default function ChatInput({ onSend, onStop, streaming }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  // textarea 自适应高度
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || streaming) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="chat-input-area">
      <textarea
        ref={textareaRef}
        className="chat-input-textarea"
        placeholder={streaming ? 'AI 正在回复中...' : '输入消息，Enter 发送，Shift+Enter 换行'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        disabled={streaming}
      />
      {streaming ? (
        <button type="button" className="chat-stop-btn" onClick={onStop}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
          停止生成
        </button>
      ) : (
        <button
          type="button"
          className="chat-send-btn"
          onClick={handleSubmit}
          disabled={!value.trim()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          发送
        </button>
      )}
    </div>
  );
}
