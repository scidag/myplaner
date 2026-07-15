import { useState, useRef, useEffect } from 'react';

export default function FilterBar({ filters, onFilterChange }) {
  const [keyword, setKeyword] = useState(filters.keyword || '');
  const debounceRef = useRef(null);

  useEffect(() => {
    setKeyword(filters.keyword || '');
  }, [filters.keyword]);

  const emit = (patch) => {
    onFilterChange({ ...filters, ...patch });
  };

  const handleSearch = (value) => {
    setKeyword(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      emit({ keyword: value });
    }, 300);
  };

  const activeCount = [
    filters.status !== 'ALL',
    !!filters.keyword,
    !!(filters.dateFrom || filters.dateTo),
    !!(filters.dueDateFrom || filters.dueDateTo),
  ].filter(Boolean).length;

  return (
    <div className="filter-bar">
      <div className={`search-box${keyword ? ' has-value' : ''}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="搜索任务标题..."
          value={keyword}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && emit({ keyword: e.target.value.trim() })}
        />
        {keyword && (
          <button className="search-clear" onClick={() => { setKeyword(''); emit({ keyword: '' }); }}>✕</button>
        )}
      </div>

      <select className="filter-select" value={filters.status} onChange={(e) => emit({ status: e.target.value })}>
        <option value="ALL">全部状态</option>
        <option value="TODO">待办</option>
        <option value="IN_PROGRESS">进行中</option>
        <option value="DONE">已完成</option>
      </select>

      <div className="date-range-group">
        <span>创建:</span>
        <input type="date" className="date-input" value={filters.dateFrom || ''} onChange={(e) => emit({ dateFrom: e.target.value })} />
        <span>—</span>
        <input type="date" className="date-input" value={filters.dateTo || ''} onChange={(e) => emit({ dateTo: e.target.value })} />
      </div>

      <div className="date-range-group">
        <span>截止:</span>
        <input type="date" className="date-input" value={filters.dueDateFrom || ''} onChange={(e) => emit({ dueDateFrom: e.target.value })} />
        <span>—</span>
        <input type="date" className="date-input" value={filters.dueDateTo || ''} onChange={(e) => emit({ dueDateTo: e.target.value })} />
      </div>

      <button className="btn-filter-clear" onClick={() => onFilterChange({
        status: 'ALL', keyword: '', dateFrom: '', dateTo: '', dueDateFrom: '', dueDateTo: '',
      })}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        清除
        {activeCount > 0 && <span className="active-filters-count">{activeCount}</span>}
      </button>
    </div>
  );
}
