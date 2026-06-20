const STATS = [
  { key: 'ALL', icon: '📊', label: '全部任务', className: 'stat-total' },
  { key: 'TODO', icon: '📝', label: '待办', className: 'stat-todo' },
  { key: 'IN_PROGRESS', icon: '⚡', label: '进行中', className: 'stat-progress' },
  { key: 'DONE', icon: '✅', label: '已完成', className: 'stat-done' },
];

export default function StatsStrip({ counts, activeStatus, onFilter }) {
  return (
    <div className="stats-strip">
      {STATS.map((s) => (
        <div
          key={s.key}
          className={`stat-card ${s.className}${activeStatus === s.key ? ' active-filter' : ''}`}
          onClick={() => onFilter(s.key)}
        >
          <div className="stat-icon">{s.icon}</div>
          <div className="stat-info">
            <div className="stat-value">{counts[s.key] ?? 0}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
