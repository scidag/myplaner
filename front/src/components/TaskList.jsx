import TaskItem from './TaskItem';

export default function TaskList({ tasks, loading, onStatusChange, onDelete }) {
  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="empty-state">
        暂无任务，创建你的第一个待办事项吧
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
