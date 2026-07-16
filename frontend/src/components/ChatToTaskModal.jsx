import { useState, useEffect, useRef } from 'react';

// 从 AI 消息内容中提取一个候选标题：取第一段非空文本，去除常见 Markdown 符号
function extractTitle(content) {
  if (!content) return '';
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    let t = line
      .replace(/^#{1,6}\s+/, '') // 标题
      .replace(/^[-*+]\s+/, '') // 列表
      .replace(/^\d+\.\s+/, '') // 有序列表
      .replace(/^>\s+/, '') // 引用
      .replace(/[*_`~]/g, ''); // 强调/代码
    t = t.trim();
    if (t) return t.length > 60 ? t.slice(0, 60) : t;
  }
  return '';
}

export default function ChatToTaskModal({ message, onClose, onConfirm, loading }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (message) {
      const raw = message.content || '';
      setTitle(extractTitle(raw));
      // 把完整内容作为描述（截断过长文本）
      setDescription(raw.length > 100000 ? raw.slice(0, 100000) : raw);
    }
  }, [message]);

  useEffect(() => {
    // 用 ref 持有最新 onClose，避免父组件传入内联函数导致监听频繁重注册
    const handler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!message) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onConfirm({
      title: title.trim(),
      description: description.trim() || null,
      dueDate: dueDate || null,
    });
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="add-modal-overlay" onClick={handleOverlayClick}>
      <div className="add-modal" role="dialog" aria-modal="true" aria-label="加入待办">
        <div className="add-modal-header">
          <div className="add-modal-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div className="add-modal-title-group">
            <h2 className="add-modal-title">加入待办</h2>
            <p className="add-modal-subtitle">将 AI 建议整理为一个待办任务</p>
          </div>
          <button className="add-modal-close" onClick={onClose} type="button" aria-label="关闭">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-modal-body">
          <div className="add-field">
            <label className="add-field-label" htmlFor="chatTaskTitle">
              任务标题 <span className="required-star">*</span>
            </label>
            <input
              id="chatTaskTitle"
              type="text"
              className="add-field-input"
              placeholder="请输入任务标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
              autoComplete="off"
            />
          </div>

          <div className="add-field">
            <label className="add-field-label" htmlFor="chatTaskDesc">
              任务描述 <span className="optional-tag">选填</span>
            </label>
            <textarea
              id="chatTaskDesc"
              className="add-field-textarea"
              placeholder="任务描述..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100000}
              rows={5}
            />
          </div>

          <div className="add-field">
            <label className="add-field-label" htmlFor="chatTaskDue">
              📅 截止日期
            </label>
            <input
              id="chatTaskDue"
              type="date"
              className="add-field-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="add-modal-footer">
            <button type="button" className="add-btn-cancel" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="add-btn-submit" disabled={loading || !title.trim()}>
              {loading ? (
                <span className="add-btn-loading">
                  <span className="add-spinner" />
                  创建中...
                </span>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="9 11 12 14 22 4" />
                  </svg>
                  加入待办
                </>
              )}
            </button>
          </div>

          <p className="add-modal-hint">
            <kbd>Esc</kbd> 关闭 &nbsp;·&nbsp; <kbd>Enter</kbd> 提交
          </p>
        </form>
      </div>
    </div>
  );
}
