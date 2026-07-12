export default function SessionSelector({
  sessions,
  selectedId,
  onSelect,
  onExtract,
  loading,
}) {
  const selected = sessions.find((s) => s.id === selectedId);

  const formatDate = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const meta = selected
    ? [
        selected.messageCount != null ? `${selected.messageCount} 条消息` : null,
        selected.updatedAt ? `最后更新 ${formatDate(selected.updatedAt)}` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <div className="session-selector-card">
      <div className="selector-label">选择会话</div>
      <div className="session-dropdown">
        <div className="session-dropdown-left">
          <div className="session-dropdown-icon">💬</div>
          <div className="session-dropdown-info">
            {selected ? (
              <>
                <div className="session-dropdown-title">{selected.title || '未命名会话'}</div>
                <div className="session-dropdown-meta">
                  {meta || '点击右侧选择会话'}
                </div>
              </>
            ) : (
              <>
                <div className="session-dropdown-title">请选择一个会话</div>
                <div className="session-dropdown-meta">
                  {sessions.length > 0
                    ? `共 ${sessions.length} 个会话可选`
                    : '暂无会话'}
                </div>
              </>
            )}
          </div>
          {sessions.length > 0 && (
            <select
              className="session-select"
              value={selectedId ?? ''}
              onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : null)}
              disabled={loading}
            >
              <option value="">选择会话…</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title || '未命名会话'}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          type="button"
          className="btn-extract"
          onClick={onExtract}
          disabled={!selectedId || loading}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0115-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 01-15 6.7L3 16" />
          </svg>
          智能抽取待办
        </button>
      </div>
    </div>
  );
}
