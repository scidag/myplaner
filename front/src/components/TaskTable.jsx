const STATUS_LABEL = { TODO: '待办', IN_PROGRESS: '进行中', DONE: '已完成' };
const STATUS_DOT = { TODO: 'todo', IN_PROGRESS: 'in-progress', DONE: 'done' };

export default function TaskTable({ tasks, selectedIds, onToggleSelect, onEdit, onStatusCycle, onDelete }) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <table className="task-table">
      <thead>
        <tr>
          <th className="col-check"><span /></th>
          <th className="col-status-dot" />
          <th>任务</th>
          <th className="col-status">状态</th>
          <th className="col-create-date">创建日期</th>
          <th className="col-due-date">截止日期</th>
          <th className="col-actions">操作</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => {
          const isDone = task.status === 'DONE';
          const isOverdue = task.dueDate && task.dueDate < today && task.status !== 'DONE';
          const isSelected = selectedIds.has(task.id);

          return (
            <tr key={task.id} className={`${isSelected ? 'selected' : ''}`}>
              <td className="col-check">
                <input type="checkbox" className="table-checkbox"
                  checked={isSelected} onChange={() => onToggleSelect(task.id)} />
              </td>
              <td className="col-status-dot">
                <span className={`status-dot ${STATUS_DOT[task.status]}`} />
              </td>
              <td>
                <span className={`table-title${isDone ? ' done' : ''}`}
                  onClick={() => onEdit(task)} title="点击编辑">
                  {task.title}
                </span>
                {task.description && <span className="table-desc">{task.description}</span>}
              </td>
              <td className="col-status">
                <span className={`status-badge ${task.status.toLowerCase()}`}>{STATUS_LABEL[task.status]}</span>
              </td>
              <td className="col-create-date">
                <span className="date-cell">{task.createTime ? task.createTime.substring(0, 10) : '-'}</span>
              </td>
              <td className="col-due-date">
                <span className={`date-cell${isOverdue ? ' overdue' : ''}`}>
                  {task.dueDate || '-'}
                  {isOverdue && <span style={{ marginLeft: 4 }}>⚠️</span>}
                </span>
              </td>
              <td className="col-actions">
                <div className="actions-cell">
                  <button className="action-btn status-next" onClick={() => onStatusCycle(task.id)}
                    title="切换状态">🔄</button>
                  <button className="action-btn edit" onClick={() => onEdit(task)} title="编辑">✏️</button>
                  <button className="action-btn delete" onClick={() => onDelete(task.id)}
                    title="删除">🗑️</button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
