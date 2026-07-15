import { useState, useEffect, useCallback } from 'react';
import TaskCard from './TaskCard';
import { getTasks } from '../api/tasks';

/** 获取本地日期，格式 YYYY-MM-DD，避免 toISOString() 使用 UTC 导致时区偏移 */
function getLocalDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function TodayPanel({ refreshKey, onStatusChange, onDelete }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => getLocalDate(new Date()));

  const today = getLocalDate(new Date());

  const fetchTasks = useCallback(async (signal) => {
    setLoading(true);
    try {
      const res = await getTasks({ page: 1, size: 100, createDate: selectedDate }, { signal });
      setTasks(res.records || []);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setTasks([]);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    const controller = new AbortController();
    fetchTasks(controller.signal);
    return () => controller.abort();
  }, [fetchTasks, refreshKey]);

  const shiftDate = (days) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(getLocalDate(d));
  };

  const goToToday = () => setSelectedDate(today);

  const isToday = selectedDate === today;

  const dateObj = new Date(selectedDate + 'T12:00:00');
  const formatted = dateObj.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });

  const title = isToday ? '今日创建' : `${formatted} 创建`;
  const subtitle = isToday ? '显示今天创建的任务' : `显示 ${formatted} 创建的任务`;

  const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const sorted = [...tasks].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 1;
    const pb = PRIORITY_ORDER[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    const order = { IN_PROGRESS: 0, TODO: 1, DONE: 2 };
    return (order[a.status] ?? 1) - (order[b.status] ?? 1);
  });

  return (
    <section className="panel panel-today">
      <div className="panel-header">
        <div className="panel-header-left">
          <div className="panel-icon">📅</div>
          <div className="panel-title-group">
            <h2 className="panel-title">{title}</h2>
            <p className="panel-subtitle">{subtitle}</p>
          </div>
        </div>
        <span className="panel-badge">{tasks.length} 个任务</span>
      </div>

      <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--color-border-light)' }}>
        <div className="date-picker-widget" style={{ flex: 1 }}>
          <button className="date-nav-btn" onClick={() => shiftDate(-1)} title="前一天">◀</button>
          <input
            type="date"
            className="date-picker-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ flex: 1, textAlign: 'center' }}
          />
          <button className="date-nav-btn" onClick={() => shiftDate(1)} title="后一天">▶</button>
        </div>
        <button className={`btn-today${isToday ? ' active-today' : ''}`} onClick={goToToday}>
          {isToday ? '今天' : '回到今天'}
        </button>
      </div>

      <div className="panel-body">
        {loading ? (
          <div className="panel-loading" />
        ) : sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illustration">🌤️</div>
            <div className="empty-title">{isToday ? '今天还没有任务' : '该日期没有任务'}</div>
            <div className="empty-desc">{isToday ? '在上方输入框快速创建一个吧' : '换个日期看看，或回到今天'}</div>
          </div>
        ) : (
          <>
            <div className="task-count-row">
              <span>共 <strong>{sorted.length}</strong> 个任务</span>
              <span>按状态排序</span>
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
          📅 {isToday ? '今天' : selectedDate}{' '}
          {tasks.length > 0 ? `共创建了 ${tasks.length} 个任务` : '暂无创建记录'}
        </span>
      </div>
    </section>
  );
}
