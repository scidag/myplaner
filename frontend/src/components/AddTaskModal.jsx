import { useState, useEffect, useRef } from 'react';

function getLocalDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const PRIORITIES = [
  { value: 'LOW', label: '低', emoji: '🟢', desc: '不着急' },
  { value: 'MEDIUM', label: '中', emoji: '🟡', desc: '一般' },
  { value: 'HIGH', label: '高', emoji: '🔴', desc: '紧急' },
];

export default function AddTaskModal({ onClose, onAdd, loading }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [titleCharCount, setTitleCharCount] = useState(0);
  const titleInputRef = useRef(null);

  const today = getLocalDate(new Date());

  useEffect(() => {
    // Auto-focus title input when modal opens
    const timer = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    if (val.length <= 100) {
      setTitle(val);
      setTitleCharCount(val.length);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      description: description.trim() || null,
      dueDate: dueDate || null,
      priority,
    });
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const isValid = title.trim().length > 0;

  return (
    <div className="add-modal-overlay" onClick={handleOverlayClick}>
      <div className="add-modal" role="dialog" aria-modal="true" aria-label="添加任务">
        {/* Modal Header */}
        <div className="add-modal-header">
          <div className="add-modal-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </div>
          <div className="add-modal-title-group">
            <h2 className="add-modal-title">创建新任务</h2>
            <p className="add-modal-subtitle">清晰地描述你的任务，让每一天都井井有条</p>
          </div>
          <button className="add-modal-close" onClick={onClose} type="button" aria-label="关闭">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="add-modal-body">
          {/* Title Field */}
          <div className="add-field">
            <label className="add-field-label" htmlFor="addTaskTitle">
              任务标题 <span className="required-star">*</span>
            </label>
            <div className="add-field-input-wrap">
              <input
                ref={titleInputRef}
                id="addTaskTitle"
                type="text"
                className="add-field-input"
                placeholder="例如：完成项目方案初稿、购买下周机票..."
                value={title}
                onChange={handleTitleChange}
                maxLength={100}
                required
                autoComplete="off"
              />
              <span className={`add-char-count${titleCharCount >= 90 ? ' near-limit' : ''}${titleCharCount >= 100 ? ' at-limit' : ''}`}>
                {titleCharCount}/100
              </span>
            </div>
          </div>

          {/* Description Field */}
          <div className="add-field">
            <label className="add-field-label" htmlFor="addTaskDesc">
              任务描述 <span className="optional-tag">选填</span>
            </label>
            <textarea
              id="addTaskDesc"
              className="add-field-textarea"
              placeholder="添加更多细节、备注或相关链接..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Due Date & Priority Row */}
          <div className="add-field-row">
            <div className="add-field add-field-half">
              <label className="add-field-label" htmlFor="addTaskDueDate">
                📅 截止日期
              </label>
              <input
                id="addTaskDueDate"
                type="date"
                className="add-field-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={today}
              />
            </div>

            <div className="add-field add-field-half">
              <label className="add-field-label">🚩 优先级</label>
              <div className="priority-chips">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    className={`priority-chip${priority === p.value ? ' active' : ''} priority-${p.value.toLowerCase()}`}
                    onClick={() => setPriority(p.value)}
                    title={p.desc}
                  >
                    <span className="priority-emoji">{p.emoji}</span>
                    <span className="priority-label">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="add-modal-footer">
            <button type="button" className="add-btn-cancel" onClick={onClose}>
              取消
            </button>
            <button
              type="submit"
              className="add-btn-submit"
              disabled={loading || !isValid}
            >
              {loading ? (
                <span className="add-btn-loading">
                  <span className="add-spinner" />
                  创建中...
                </span>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  创建任务
                </>
              )}
            </button>
          </div>

          {/* Keyboard Hint */}
          <p className="add-modal-hint">
            <kbd>Esc</kbd> 关闭 &nbsp;·&nbsp; <kbd>Enter</kbd> 提交
          </p>
        </form>
      </div>
    </div>
  );
}
