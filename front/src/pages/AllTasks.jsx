import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import StatsStrip from '../components/StatsStrip';
import FilterBar from '../components/FilterBar';
import ActionBar from '../components/ActionBar';
import TaskTable from '../components/TaskTable';
import TaskCardView from '../components/TaskCardView';
import EditTaskModal from '../components/EditTaskModal';
import PaginationBar from '../components/PaginationBar';
import { getTasks, createTask, updateTask, updateTaskStatus, deleteTask, batchUpdateStatus, batchDelete } from '../api/tasks';
import { useToast } from '../components/Toast';

const DEFAULT_FILTERS = {
  status: 'ALL', keyword: '', dateFrom: '', dateTo: '', dueDateFrom: '', dueDateTo: '',
};

export default function AllTasks() {
  const navigate = useNavigate();
  const toast = useToast();
  const searchInputRef = useRef(null);

  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ ALL: 0, TODO: 0, IN_PROGRESS: 0, DONE: 0 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [view, setView] = useState('table');
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [sort, setSort] = useState('createTime');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingTask, setEditingTask] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: pageSize };
      if (filters.status !== 'ALL') params.status = filters.status;
      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.dateFrom) params.createDateFrom = filters.dateFrom;
      if (filters.dateTo) params.createDateTo = filters.dateTo;
      if (filters.dueDateFrom) params.dueDateFrom = filters.dueDateFrom;
      if (filters.dueDateTo) params.dueDateTo = filters.dueDateTo;
      if (sort) params.sort = sort;
      if (sortDir) params.sortDir = sortDir;

      const res = await getTasks(params);
      setTasks(res.records || []);
      setTotal(res.total || 0);

      const cnt = { ALL: 0, TODO: 0, IN_PROGRESS: 0, DONE: 0 };
      if (res.total != null) {
        const allRes = await getTasks({ page: 1, size: 1 });
        const todoRes = await getTasks({ page: 1, size: 1, status: 'TODO' });
        const progRes = await getTasks({ page: 1, size: 1, status: 'IN_PROGRESS' });
        const doneRes = await getTasks({ page: 1, size: 1, status: 'DONE' });
        cnt.ALL = allRes.total || 0;
        cnt.TODO = todoRes.total || 0;
        cnt.IN_PROGRESS = progRes.total || 0;
        cnt.DONE = doneRes.total || 0;
      }
      setCounts(cnt);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters, sort, sortDir, toast]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.querySelector('.search-input')?.focus();
      }
      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        setEditingTask(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
    setSelectedIds(new Set());
  };

  const handleSortChange = (field) => {
    if (sort === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const handleToggleSelectAll = () => {
    const allSelected = tasks.every((t) => selectedIds.has(t.id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set(selectedIds);
      tasks.forEach((t) => next.add(t.id));
      setSelectedIds(next);
    }
  };

  const handleToggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBatchStatus = async (status) => {
    if (selectedIds.size === 0) return;
    const label = { TODO: '待办', DONE: '完成' }[status] || status;
    if (!window.confirm(`确定将选中的 ${selectedIds.size} 个任务标记为「${label}」吗？`)) return;
    try {
      await batchUpdateStatus([...selectedIds], status);
      toast(`已更新 ${selectedIds.size} 个任务`, 'success');
      setSelectedIds(new Set());
      fetchTasks();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`确定删除选中的 ${selectedIds.size} 个任务吗？此操作不可撤销。`)) return;
    try {
      await batchDelete([...selectedIds]);
      toast(`已删除 ${selectedIds.size} 个任务`, 'error');
      setSelectedIds(new Set());
      fetchTasks();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleStatusCycle = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const order = ['TODO', 'IN_PROGRESS', 'DONE'];
    const idx = order.indexOf(task.status);
    const nextStatus = order[(idx + 1) % order.length];
    try {
      await updateTaskStatus(id, nextStatus);
      toast(`🔄 状态已切换`, 'info');
      fetchTasks();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleEdit = (task) => setEditingTask(task);

  const handleSaveEdit = async (data) => {
    if (!editingTask) return;
    try {
      await updateTask(editingTask.id, data);
      toast('✅ 任务已更新', 'success');
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除该任务吗？此操作不可撤销。')) return;
    try {
      await deleteTask(id);
      toast('🗑️ 任务已删除', 'error');
      fetchTasks();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="app-shell">
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="nav-left">
          <button className="btn-back" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            返回
          </button>
          <div className="nav-title-group">
            <h1 className="nav-title">📋 全部任务</h1>
            <span className="nav-breadcrumb">/ 任务管理</span>
          </div>
        </div>
        <div className="nav-right">
          <div className="view-toggle">
            <button className={`view-toggle-btn${view === 'table' ? ' active' : ''}`}
              onClick={() => setView('table')} title="列表视图">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
            <button className={`view-toggle-btn${view === 'card' ? ' active' : ''}`}
              onClick={() => setView('card')} title="卡片视图">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
            </button>
          </div>
          <button className="btn-refresh" onClick={fetchTasks}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            刷新
          </button>
        </div>
      </nav>

      {/* Stats Strip */}
      <StatsStrip counts={counts} activeStatus={filters.status} onFilter={(s) => {
        setFilters((f) => ({ ...f, status: s }));
        setPage(1);
      }} />

      {/* Filter Bar */}
      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      {/* Action Bar */}
      <ActionBar
        selectedIds={selectedIds}
        totalSelected={selectedIds.size}
        totalFiltered={total}
        onToggleSelectAll={handleToggleSelectAll}
        onBatchStatus={handleBatchStatus}
        onBatchDelete={handleBatchDelete}
        sort={sort}
        sortDir={sortDir}
        onSortChange={handleSortChange}
        onSortDirToggle={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
      />

      {/* Table View */}
      {view === 'table' && (
        <div className="task-table-container">
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}><div className="panel-loading" /></div>
          ) : tasks.length === 0 ? (
            <div className="table-empty">
              <div className="empty-icon">🔍</div>
              <div className="empty-title">
                {filters.keyword ? `没有找到包含「${filters.keyword}」的任务` : '没有匹配的任务'}
              </div>
              <div className="empty-desc">尝试调整筛选条件</div>
              <button className="btn-reset-filter" onClick={() => handleFilterChange({ ...DEFAULT_FILTERS })}>
                重置筛选
              </button>
            </div>
          ) : (
            <TaskTable
              tasks={tasks}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onEdit={handleEdit}
              onStatusCycle={handleStatusCycle}
              onDelete={handleDelete}
            />
          )}
        </div>
      )}

      {/* Card View */}
      {view === 'card' && (
        tasks.length === 0 ? (
          <div className="table-empty" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div className="empty-icon">🔍</div>
            <div className="empty-title">
              {filters.keyword ? `没有找到包含「${filters.keyword}」的任务` : '没有匹配的任务'}
            </div>
            <div className="empty-desc">尝试调整筛选条件</div>
            <button className="btn-reset-filter" onClick={() => handleFilterChange({ ...DEFAULT_FILTERS })}>
              重置筛选
            </button>
          </div>
        ) : (
          <TaskCardView
            tasks={tasks}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onEdit={handleEdit}
            onStatusCycle={handleStatusCycle}
            onDelete={handleDelete}
          />
        )
      )}

      {/* Pagination */}
      {total > 0 && (
        <PaginationBar
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={(p) => { setPage(p); setSelectedIds(new Set()); }}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); setSelectedIds(new Set()); }}
        />
      )}

      {/* Edit Modal */}
      {editingTask && (
        <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} onSave={handleSaveEdit} />
      )}
    </div>
  );
}
