const STATUS_LABEL = { TODO: '待办', IN_PROGRESS: '进行中', DONE: '已完成' };
const PRIORITY_CONFIG = {
  HIGH:   { label: '高', cls: 'priority-badge-high'   },
  MEDIUM: { label: '中', cls: 'priority-badge-medium' },
  LOW:    { label: '低', cls: 'priority-badge-low'    },
};

function getLocalDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function TaskCardView({ tasks, selectedIds, onToggleSelect, onEdit, onStatusCycle, onDelete }) {
  const today = getLocalDate(new Date());

  return (
    <div className="task-card-grid">
      {tasks.map((task) => {
        const isDone = task.status === 'DONE';
        const isOverdue = task.dueDate && task.dueDate < today && task.status !== 'DONE';
        const isSelected = selectedIds.has(task.id);
        const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;

        return (
          <div key={task.id} className={`task-card-view${isSelected ? ' selected' : ''}`}>
            <input type="checkbox" className="select-check"
              checked={isSelected} onChange={() => onToggleSelect(task.id)} />
            <div className="card-header">
              <span className={`card-title${isDone ? ' done' : ''}`}>{task.title}</span>
              <span className={`status-badge ${task.status.toLowerCase()}`}>{STATUS_LABEL[task.status]}</span>
            </div>
            {task.description && <div className="table-desc" style={{ marginBottom: 8 }}>{task.description}</div>}
            <div className="card-meta">
              <span>🕐 {task.createTime ? task.createTime.substring(0, 10) : '-'}</span>
              <span className={isOverdue ? 'date-cell overdue' : ''}>
                📌 {task.dueDate || '无截止日期'}
                {isOverdue && <span style={{ marginLeft: 4 }}>⚠️</span>}
              </span>
              <span className={`priority-badge ${p.cls}`}>{p.label}</span>
            </div>
            <div className="card-actions">
              <button className="action-btn status-next" onClick={() => onStatusCycle(task.id)} title="切换状态">🔄</button>
              <button className="action-btn edit" onClick={() => onEdit(task)} title="编辑">✏️</button>
              <button className="action-btn delete" onClick={() => onDelete(task.id)} title="删除">🗑️</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
