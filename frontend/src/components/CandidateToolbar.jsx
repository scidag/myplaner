export default function CandidateToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onInvert,
  onBatchCreate,
  creating,
}) {
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  return (
    <div className="bottom-bar">
      <div className="bottom-bar-left">
        <label
          className="select-all-label"
          onClick={(e) => {
            e.preventDefault();
            onSelectAll?.(!allSelected);
          }}
        >
          <div className={`candidate-check${allSelected ? ' checked' : ''}`} style={{ marginTop: 0 }}>
            {allSelected && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          全选
        </label>
        <button type="button" className="btn-link" onClick={onInvert}>
          反选
        </button>
      </div>
      <div className="bottom-bar-right">
        <span className="selected-count">
          已选 <strong>{selectedCount}</strong> 项
        </span>
        <button
          type="button"
          className="btn-batch-create"
          onClick={onBatchCreate}
          disabled={selectedCount === 0 || creating}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          批量创建 ({selectedCount})
        </button>
      </div>
    </div>
  );
}
