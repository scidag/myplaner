import { useState, useEffect, useRef } from 'react';

const STATUS_LABEL = {
  TODO: '待办',
  IN_PROGRESS: '进行中',
  DONE: '已完成',
};

const STATUS_BADGE = {
  TODO: 'status-todo-badge',
  IN_PROGRESS: 'status-in-progress-badge',
  DONE: 'status-done-badge',
};

const STATUS_DOT = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  DONE: 'done',
};

const STATUS_OPTIONS = [
  { value: 'TODO', label: '待办', dot: 'todo' },
  { value: 'IN_PROGRESS', label: '进行中', dot: 'in-progress' },
  { value: 'DONE', label: '已完成', dot: 'done' },
];

const PRIORITY_CONFIG = {
  HIGH:   { label: '高', cls: 'priority-badge-high',   icon: '🔴' },
  MEDIUM: { label: '中', cls: 'priority-badge-medium', icon: '🟡' },
  LOW:    { label: '低', cls: 'priority-badge-low',    icon: '🟢' },
};

export default function TaskCard({ task, index, onStatusChange, onDelete, onView }) {
  const isDone = task.status === 'DONE';
  const dateLabel = new Date(task.createTime).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
  const [statusOpen, setStatusOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!statusOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [statusOpen]);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('确定删除该任务吗？此操作不可撤销。')) {
      onDelete(task.id);
    }
  };

  const handleView = (e) => {
    e.stopPropagation();
    if (onView) onView(task);
  };

  const handleStatusSelect = (status, e) => {
    e.stopPropagation();
    setStatusOpen(false);
    if (status !== task.status) {
      onStatusChange(task.id, status);
    }
  };

  const toggleStatus = (e) => {
    e.stopPropagation();
    setStatusOpen((o) => !o);
  };

  return (
    <div
      className={`task-card${isDone ? ' is-done' : ''}`}
      style={{ animationDelay: `${(index || 0) * 0.04}s` }}
    >
      <div className={`task-status-dot ${STATUS_DOT[task.status]}`} />
      <div className="task-body">
        <div className="task-card-title">{task.title}</div>
        <div className="task-card-meta">
          <span>🕐 {dateLabel}</span>
          <span>📌 {task.dueDate ? `截止: ${task.dueDate}` : '无截止日期'}</span>
          <span className={`priority-badge ${priority.cls}`}>
            {priority.icon} {priority.label}
          </span>
        </div>
      </div>
      <div className="status-dropdown-wrap" ref={dropdownRef}>
        <button
          type="button"
          className={`task-card-status status-badge-btn ${STATUS_BADGE[task.status]}`}
          onClick={toggleStatus}
          title="点击切换状态"
        >
          {STATUS_LABEL[task.status]}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {statusOpen && (
          <div className="status-dropdown-menu">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`status-dropdown-item${opt.value === task.status ? ' active' : ''}`}
                onClick={(e) => handleStatusSelect(opt.value, e)}
              >
                <span className={`status-dot ${opt.dot}`} />
                {opt.label}
                {opt.value === task.status && <span className="status-check">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="task-card-actions">
        <button className="task-action-btn view" onClick={handleView} title="查看详情">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <button className="task-action-btn delete" onClick={handleDelete} title="删除">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
