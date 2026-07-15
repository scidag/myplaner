const STATUS_LABEL = {
  TODO: '待办',
  IN_PROGRESS: '进行中',
  DONE: '已完成',
};

export default function TaskItem({ task, onStatusChange, onDelete }) {
  const handleStatusChange = (e) => {
    onStatusChange(task.id, e.target.value);
  };

  const handleDelete = () => {
    if (window.confirm('确定删除该任务吗？')) {
      onDelete(task.id);
    }
  };

  const isDone = task.status === 'DONE';

  return (
    <div className={`task-item${isDone ? ' completed' : ''}`}>
      <div className="task-info">
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          {task.dueDate ? `截止日期: ${task.dueDate}` : '无截止日期'}
        </div>
      </div>
      <div className="task-actions">
        <span className={`status-badge status-${task.status.toLowerCase()}`}>
          {STATUS_LABEL[task.status]}
        </span>
        <select value={task.status} onChange={handleStatusChange}>
          <option value="TODO">待办</option>
          <option value="IN_PROGRESS">进行中</option>
          <option value="DONE">已完成</option>
        </select>
        <button className="btn-delete" onClick={handleDelete}>
          删除
        </button>
      </div>
    </div>
  );
}
