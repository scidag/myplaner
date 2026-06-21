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

const PRIORITY_CONFIG = {
  HIGH:   { label: '高', cls: 'priority-badge-high',   icon: '🔴' },
  MEDIUM: { label: '中', cls: 'priority-badge-medium', icon: '🟡' },
  LOW:    { label: '低', cls: 'priority-badge-low',    icon: '🟢' },
};

export default function TaskCard({ task, index, onStatusChange, onDelete }) {
  const isDone = task.status === 'DONE';
  const dateLabel = new Date(task.createTime).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;

  const handleClick = () => {
    const order = ['TODO', 'IN_PROGRESS', 'DONE'];
    const idx = order.indexOf(task.status);
    const next = order[(idx + 1) % order.length];
    onStatusChange(task.id, next);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('确定删除该任务吗？此操作不可撤销。')) {
      onDelete(task.id);
    }
  };

  return (
    <div
      className={`task-card${isDone ? ' is-done' : ''}`}
      style={{ animationDelay: `${(index || 0) * 0.04}s` }}
      onClick={handleClick}
      title="点击切换状态"
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
      <span className={`task-card-status ${STATUS_BADGE[task.status]}`}>
        {STATUS_LABEL[task.status]}
      </span>
      <div className="task-card-actions">
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
