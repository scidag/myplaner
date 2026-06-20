const SORT_OPTIONS = [
  { key: 'createTime', label: '创建时间' },
  { key: 'dueDate', label: '截止日期' },
  { key: 'status', label: '状态' },
  { key: 'title', label: '标题' },
];

export default function ActionBar({
  selectedIds, totalSelected, totalFiltered,
  onToggleSelectAll, onBatchStatus, onBatchDelete, onClearSelection,
  sort, sortDir, onSortChange, onSortDirToggle,
}) {
  const allSelected = totalFiltered > 0 && selectedIds.size === totalFiltered;
  const hasSelection = selectedIds.size > 0;

  return (
    <div className="action-bar">
      <div className="batch-actions">
        <input type="checkbox" className="checkbox-all" checked={allSelected && hasSelection}
          onChange={onToggleSelectAll} title="全选" />
        <span className="batch-label">已选 <span className="batch-count">{totalSelected}</span> 项</span>
        {hasSelection && (
          <>
            <button className="btn-batch visible" onClick={() => onBatchStatus('TODO')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              标为待办
            </button>
            <button className="btn-batch visible" onClick={() => onBatchStatus('DONE')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              标为完成
            </button>
            <button className="btn-batch danger visible" onClick={onBatchDelete}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
              批量删除
            </button>
          </>
        )}
      </div>

      <div className="sort-group">
        <span>排序:</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            className={`sort-chip${sort === opt.key ? ' active' : ''}`}
            onClick={() => onSortChange(opt.key)}
          >
            {opt.label}
          </button>
        ))}
        <button className="sort-dir-btn" onClick={onSortDirToggle} title="切换排序方向">
          {sortDir === 'asc' ? '↑' : '↓'}
        </button>
      </div>
    </div>
  );
}
