import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../components/Header';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import {
  getTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
} from '../api/tasks';
import { useToast } from '../components/Toast';

const FILTERS = [
  { key: 'ALL', label: '全部' },
  { key: 'TODO', label: '待办' },
  { key: 'IN_PROGRESS', label: '进行中' },
  { key: 'DONE', label: '已完成' },
];

export default function Home() {
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTasks({ page, size: 20, status: filter, keyword });
      setTasks(res.records);
      setTotal(res.total);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, filter, keyword, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSearch = (value) => {
    setKeyword(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
    }, 300);
  };

  const handleAdd = async ({ title, dueDate }) => {
    setSubmitting(true);
    try {
      await createTask({ title, dueDate });
      toast('创建成功', 'success');
      setPage(1);
      await fetchTasks();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateTaskStatus(id, status);
      await fetchTasks();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      toast('删除成功', 'success');
      await fetchTasks();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="app-container">
      <Header />
      <div className="main-content">
        <TaskForm onAdd={handleAdd} loading={submitting} />

        <div className="toolbar">
          <div className="filter-group">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`filter-btn${filter === f.key ? ' active' : ''}`}
                onClick={() => { setFilter(f.key); setPage(1); }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="search-input"
            placeholder="搜索任务..."
            value={keyword}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <TaskList
          tasks={tasks}
          loading={loading}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />

        {totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              上一页
            </button>
            <span>第 {page} / {totalPages} 页</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
