import { useState, useCallback } from 'react';
import Header from '../components/Header';
import QuickAddBar from '../components/QuickAddBar';
import TodayPanel from '../components/TodayPanel';
import TodoPanel from '../components/TodoPanel';
import { createTask, updateTaskStatus, deleteTask } from '../api/tasks';
import { useToast } from '../components/Toast';

export default function Home() {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  const handleAdd = async ({ title, dueDate }) => {
    setSubmitting(true);
    try {
      await createTask({ title, dueDate });
      toast('✅ 任务创建成功!', 'success');
      triggerRefresh();
    } catch (err) {
      toast(err.message || '创建失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = useCallback(async (id, status) => {
    try {
      await updateTaskStatus(id, status);
      const label = { TODO: '待办', IN_PROGRESS: '进行中', DONE: '已完成' };
      toast(`🔄 任务已切换为 ${label[status] || status}`, 'info');
      triggerRefresh();
    } catch (err) {
      toast(err.message || '操作失败', 'error');
    }
  }, [toast]);

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteTask(id);
      toast('🗑️ 任务已删除', 'error');
      triggerRefresh();
    } catch (err) {
      toast(err.message || '删除失败', 'error');
    }
  }, [toast]);

  return (
    <div className="app-shell">
      <Header />
      <QuickAddBar onAdd={handleAdd} loading={submitting} />
      <div className="dual-panel">
        <TodayPanel
          refreshKey={refreshKey}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
        <TodoPanel
          refreshKey={refreshKey}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
