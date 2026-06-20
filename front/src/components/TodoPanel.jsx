import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TaskCard from './TaskCard';
import { getTasks } from '../api/tasks';

export default function TodoPanel({ refreshKey, onStatusChange, onDelete }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async (signal) => {
    setLoading(true);
    try {
      const res = await getTasks({ page: 1, size: 100, status: 'TODO' }, { signal });
      setTasks(res.records || []);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setTasks([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchTasks(controller.signal);
    return () => controller.abort();
  }, [fetchTasks, refreshKey]);

  const sorted = [...tasks].sort((a, b) => {
    if (a.createTime > b.createTime) return -1;
    if (a.createTime < b.createTime) return 1;
    return 0;
  });

  return (
    <section className="panel panel-all-todo">
      <div className="panel-header">
        <div className="panel-header-left">
          <div className="panel-icon">📋</div>
          <div className="panel-title-group">
            <h2 className="panel-title">全部待办</h2>
            <p className="panel-subtitle">所有状态为「待办」的任务</p>
          </div>
        </div>
        <span className="panel-badge">{tasks.length} 个待办</span>
      </div>

      <div className="panel-body">
        {loading ? (
          <div className="panel-loading" />
        ) : sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illustration">🎉</div>
            <div className="empty-title">没有待办任务</div>
            <div className="empty-desc">太棒了，所有任务都完成了!</div>
          </div>
        ) : (
          <>
            <div className="task-count-row">
              <span>共 <strong>{sorted.length}</strong> 个待办</span>
              <span>按创建时间倒序</span>
            </div>
            {sorted.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                index={i}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
              />
            ))}
          </>
        )}
      </div>

      <div className="panel-footer">
        <span className="panel-footer-info">
          {tasks.length > 0 ? `📋 还有 ${tasks.length} 个任务等待处理` : '✨ 所有任务已清空'}
        </span>
        <button className="btn-view-all" onClick={() => navigate('/tasks')}>
          查看全部
          <span>→</span>
        </button>
      </div>
    </section>
  );
}
