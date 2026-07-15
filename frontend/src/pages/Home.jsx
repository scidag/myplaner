import { useState, useCallback } from 'react';
import QuickAddBar from '../components/QuickAddBar';
import AddTaskModal from '../components/AddTaskModal';
import TodayPanel from '../components/TodayPanel';
import TodoPanel from '../components/TodoPanel';
import { createTask, updateTaskStatus, deleteTask } from '../api/tasks';
import { useToast } from '../components/Toast';

const STATUS_LABEL = {
  TODO: '待办',
  IN_PROGRESS: '进行中',
  DONE: '已完成',
};

const STATUS_BADGE_CLS = {
  TODO: 'status-badge todo',
  IN_PROGRESS: 'status-badge in-progress',
  DONE: 'status-badge done',
};

const STATUS_DOT_CLS = {
  TODO: 'status-dot todo',
  IN_PROGRESS: 'status-dot in-progress',
  DONE: 'status-dot done',
};

const PRIORITY_CONFIG = {
  HIGH:   { label: '高', icon: '🔴' },
  MEDIUM: { label: '中', icon: '🟡' },
  LOW:    { label: '低', icon: '🟢' },
};

function formatDate(str) {
  if (!str) return '无';
  const d = new Date(str);
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function Home() {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewingTask, setViewingTask] = useState(null);

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  const handleAdd = async ({ title, description, dueDate, priority }) => {
    setSubmitting(true);
    try {
      await createTask({ title, description, dueDate, priority });
      toast('✅ 任务创建成功!', 'success');
      setShowAddModal(false);
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

  const handleView = useCallback((task) => {
    setViewingTask(task);
  }, []);

  const priority = viewingTask ? (PRIORITY_CONFIG[viewingTask.priority] || PRIORITY_CONFIG.MEDIUM) : null;

  return (
    <div className="app-shell">
      <QuickAddBar onOpenModal={() => setShowAddModal(true)} />

      {showAddModal && (
        <AddTaskModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
          loading={submitting}
        />
      )}
      <div className="dual-panel">
        <TodayPanel
          refreshKey={refreshKey}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onView={handleView}
        />
        <TodoPanel
          refreshKey={refreshKey}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onView={handleView}
        />
      </div>

      {viewingTask && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewingTask(null); }}>
          <div className="modal task-detail-modal">
            <h3>📋 任务详情</h3>
            <div className="detail-modal-body">
              <div className="detail-field">
                <label>任务标题</label>
                <div className="detail-value detail-title">{viewingTask.title}</div>
              </div>
              <div className="detail-field">
                <label>描述</label>
                <div className="detail-value detail-desc">{viewingTask.description || '无描述'}</div>
              </div>
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>状态</label>
                  <div className="detail-value">
                    <span className={STATUS_BADGE_CLS[viewingTask.status]}>
                      <span className={STATUS_DOT_CLS[viewingTask.status]} />
                      {STATUS_LABEL[viewingTask.status]}
                    </span>
                  </div>
                </div>
                <div className="detail-field">
                  <label>优先级</label>
                  <div className="detail-value">
                    {priority.icon} {priority.label}
                  </div>
                </div>
              </div>
              <div className="detail-field-row">
                <div className="detail-field">
                  <label>创建时间</label>
                  <div className="detail-value">{formatDate(viewingTask.createTime)}</div>
                </div>
                <div className="detail-field">
                  <label>截止日期</label>
                  <div className="detail-value">{viewingTask.dueDate || '无'}</div>
                </div>
              </div>
              {viewingTask.status === 'DONE' && viewingTask.completedTime && (
                <div className="detail-field">
                  <label>完成时间</label>
                  <div className="detail-value">{formatDate(viewingTask.completedTime)}</div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setViewingTask(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
