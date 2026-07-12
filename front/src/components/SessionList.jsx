export default function SessionList({ sessions, activeSessionId, onSelect, onCreate, onDelete }) {
  return (
    <aside className="chat-sidebar">
      <button type="button" className="chat-new-btn" onClick={onCreate}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        新建对话
      </button>

      <div className="chat-sessions">
        <div className="chat-sessions-header">会话列表</div>
        {sessions.length === 0 ? (
          <div className="chat-sessions-empty">暂无会话</div>
        ) : (
          <ul className="session-list">
            {sessions.map((s) => (
              <li
                key={s.id}
                className={`session-item${s.id === activeSessionId ? ' active' : ''}`}
                onClick={() => onSelect(s.id)}
              >
                <div className="session-item-body">
                  <div className="session-item-title">{s.title || '新对话'}</div>
                  {s.preview != null && (
                    <div className="session-item-preview">{s.preview}</div>
                  )}
                </div>
                <button
                  type="button"
                  className="session-item-del"
                  title="删除会话"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`确定删除会话「${s.title || '新对话'}」吗？`)) {
                      onDelete(s.id);
                    }
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
